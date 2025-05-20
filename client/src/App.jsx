import { useEffect, useState } from 'react';
import Quiz from './Quiz';
import Checklist from './Checklist';
import './App.css';
import Navbar from './Navbar'; 
import QuizReview from './QuizReview';
import { Routes, Route, useNavigate } from 'react-router-dom';
import QuizReviewPage from './QuizReviewPage';
import HomePage from './HomePage'; // ✅ import the component you just made
import ResidencyDocsChecklist from './ResidencyDocsChecklist';
import TaxDocsChecklist from './TaxDocsChecklist';
import FileUploadArea from './FileUploadArea';



const keywordMappings = {
  'CA Driver\'s License or ID': [
  'driver license',
  'driver\'s license',
  'id card',
  'california id',
  'california identification card',
  'identification card', 'ca id', 'state id', 'id', 'california id card', 'card' 
],
  'Lease or Rental Agreement': ['lease agreement', 'rental agreement', 'lease'],
  'Voter Registration': ['voter registration', 'political', 'political party', 'party', 'preference'],
  'Car Registration': ['vehicle registration', 'car registration'],
  'State Tax Returns': ['state tax return'],
  'Federal Tax Returns': ['federal tax return'],
  'W2 or Pay Stubs': ['w2', 'pay stub'],
  'Utility Bill': ['utility bill', 'electric bill', 'gas bill'],
  'Bank Account Statement (CA Address)': ['bank statement', 'bank', 'chase'],
  'Parent\'s CA Driver\'s License': ['parent driver license', 'parent id card'],
  'Parent\'s Lease or Rental Agreement': ['parent lease', 'parent rental'],
  'Parent\'s State Tax Returns': ['parent state tax return'],
  'Parent\'s Utility Bills': ['parent utility bill'],
  'High School Transcripts showing CA address': ['high school transcript'],
  'Active Duty Military Orders': ['military orders', 'active duty'],
  'Military ID': ['military id'],
  'Proof of CA Stationing': ['ca stationing proof'],
  'Military Spouse or Dependent Documentation': ['military dependent'],
  'Utility Bill at CA address': ['utility bill'],
  "Parent\'s Tax Return": [
  'form 1040','1040', 'irs', 'social security',
  'u.s. individual income tax return',
  'internal revenue service',
  'irs form 1040',
  '2022 tax return', '2023 tax return', '2024 tax return'
],

};

// Helper to get RDD date
const getRDDDate = (quarter, year) => {
  if (!quarter || !year) return null;
  const rddYear = Number(year) - 1;

  switch (quarter) {
    case 'Fall': return new Date(`${rddYear}-09-20`);
    case 'Winter': return new Date(`${rddYear}-01-05`);
    case 'Spring': return new Date(`${rddYear}-04-01`);
    case 'Summer': return new Date(`${rddYear}-07-01`);
    default: return null;
  }
};

const getNameMatchScore = (target, first, last) => {
  const normalize = (s) => s?.toLowerCase().replace(/[^a-z]/g, '');
  const name = normalize(target);
  return name.includes(normalize(first)) && name.includes(normalize(last));
};



function App() {
  const [status, setStatus] = useState(null);
  const [residencyType, setResidencyType] = useState('');
  const [quarter, setQuarter] = useState('');
  const [year, setYear] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  const [uploadMessage, setUploadMessage] = useState('');
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [completedDocuments, setCompletedDocuments] = useState([]);
  const [checklistComplete, setChecklistComplete] = useState(false);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [rddValidationMessage, setRDDValidationMessage] = useState('');

  //const [selectedRDDDate, setSelectedRDDDate] = useState('');
  const [extractedDates, setExtractedDates] = useState([]);
  const [isLeaseDoc, setIsLeaseDoc] = useState(false);
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [leaseValidationMessage, setLeaseValidationMessage] = useState('');

  const [documentDates, setDocumentDates] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentSelectedDate, setCurrentSelectedDate] = useState('');

  const [financialDocs, setFinancialDocs] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [crossCheckMessage, setCrossCheckMessage] = useState('');

  const [checklistStep, setChecklistStep] = useState(1);

 





  const [documentTypes, setDocumentTypes] = useState({
    isLease: false,
    isGeneralResidency: false
  });
  
  useEffect(() => {
    fetch('http://localhost:3000/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error("Failed to fetch backend status:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEligibility(null);

    const formData = { residencyType, quarter, year };

    try {
      const response = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setEligibility(data.eligibility);
    } catch (err) {
      console.error("Error submitting form:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFile = async (file) => {
    setCurrentSelectedDate('');
    //const file = e.target.files[0];
    if (!file) return;
  
    // Reset state
    setUploadMessage('');
    setAnalysisInfo(null);
    setRDDValidationMessage('');
    setLeaseValidationMessage('');
    setExtractedDates([]);
    setDocumentTypes({ isLease: false, isGeneralResidency: false });
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const uploadRes = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      const uploadData = await uploadRes.json();
      setUploadMessage(`✅ ${uploadData.filename} uploaded successfully (${Math.round(uploadData.size / 1024)} KB)`);
  
      const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: uploadData.path }),
      });
  
      const analysisData = await analyzeRes.json();
      setAnalysisInfo(analysisData);
  
      const { extractedDates = [], textSnippet = '' } = analysisData;
      const text = textSnippet.toLowerCase();
      const filename = uploadData.filename.toLowerCase();
  
      // Update document types
      const isLease = filename.includes("lease") || text.includes("lease");
      const isTaxReturn = ['form 1040', 'irs', 'tax return'].some(kw => text.includes(kw));

      setDocumentTypes({
        isLease,
        isGeneralResidency: true,
        isTaxReturn
      });
  
      // If dates were found, auto-validate the first one
      if (extractedDates.length > 0) {
        setExtractedDates(extractedDates);
        setCurrentSelectedDate(extractedDates[0]);
        validateRDDFromExtractedDate(extractedDates[0]);
      }
  
    } catch (err) {
      console.error("Upload or analysis error:", err);
      setUploadMessage('❌ Failed to upload or analyze file.');
    }
  };  

  const confirmUpload = () => {
    if (!selectedFile || !analysisInfo) return;
  
    let matchedDocs = matchUploadedDocument(
      analysisInfo.textSnippet,
      selectedFile.name
    );

    let crossCheckWarning = null;
    const docText = analysisInfo.textSnippet.toLowerCase();

    // Check if CA ID matches user
    if (matchedDocs.includes("CA Driver's License or ID")) {
      const nameMatch = getNameMatchScore(docText, quizAnswers.firstName, quizAnswers.lastName);
      const dobMatch = quizAnswers.dob && docText.includes(quizAnswers.dob.replace(/-/g, '/'));
      if (!nameMatch || !dobMatch) {
        crossCheckWarning = "⚠️ This doesn't appear to be your CA ID.";
      }
    }

    // Check if parent tax return matches either parent
    if (matchedDocs.includes("Parent's Tax Return")) {
      const parent1Match = getNameMatchScore(docText, quizAnswers.parent1First, quizAnswers.parent1Last);
      const parent2Match = quizAnswers.parent2First
        ? getNameMatchScore(docText, quizAnswers.parent2First, quizAnswers.parent2Last)
        : false;
      if (!parent1Match && !parent2Match) {
        crossCheckWarning = "⚠️ This may not match your parent or guardian’s name.";
      }
    }

    
    // Force correct matching if it’s a tax return
    if (documentTypes.isTaxReturn) {
      matchedDocs = ["Parent's Tax Return"];
    }


    if (documentTypes.isTaxReturn && residencyType === 'independent') {
      const petitionYear = Number(year);
      const expectedYears = [petitionYear - 1, petitionYear - 2, petitionYear - 3];
      const validYears = (analysisInfo?.taxYears || []).filter(y => expectedYears.includes(Number(y)));
    
      if (validYears.length > 0) {
        setFinancialDocs(prev => [...new Set([...prev, ...validYears])]);
      }
    }
     
    const newDocDates = { ...documentDates };
  
    matchedDocs.forEach(doc => {
      // Only add if it's not already in completedDocuments
      if (!completedDocuments.includes(doc)) {
        if (doc === 'Lease or Rental Agreement') {
          newDocDates[doc] = {
            start: leaseStartDate,
            end: leaseEndDate
          };
        } else {
          newDocDates[doc] = currentSelectedDate;
        }
      }
    });
  
    setDocumentDates(newDocDates);
    setCompletedDocuments(prev => [...new Set([...prev, ...matchedDocs])]);
  
    setUploadMessage(`✅ ${selectedFile.name} uploaded successfully (${Math.round(selectedFile.size / 1024)} KB)`);
    if (crossCheckWarning) {
      setCrossCheckMessage(crossCheckWarning);
    } else {
      setCrossCheckMessage('');
    }
    
    

    // Clear temporary state
    setSelectedFile(null);
    setExtractedDates([]);
    setCurrentSelectedDate('');
    setLeaseStartDate('');
    setLeaseEndDate('');
    setDocumentTypes({ isLease: false, isGeneralResidency: false });
  };
  
  const matchUploadedDocument = (textSnippet, filename, dateLabel = null) => {
    const lowerText = textSnippet.toLowerCase() + ' ' + filename.toLowerCase();
  
    // ⛔️ Hard filter for parent tax return
    if (documentTypes.isTaxReturn) {
      const docName = "Parent's Tax Return";
      const newDates = { ...documentDates };
      if (dateLabel) newDates[docName] = dateLabel;
  
      setCompletedDocuments(prev => [...new Set([...prev, docName])]);
      setDocumentDates(newDates);
  
      return [docName];
    }
  
    // ✅ Continue with normal matching
    const newMatches = [];
    const newDates = { ...documentDates };
  
  
    for (const [docName, keywords] of Object.entries(keywordMappings)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          newMatches.push(docName);
  
          if (dateLabel) {
            // If it's already a lease, preserve start/end
            if (typeof newDates[docName] === 'object') {
              newDates[docName] = {
                ...newDates[docName],
                single: dateLabel // fallback for lease if clicked
              };
            } else {
              newDates[docName] = dateLabel;
            }
          }
  
          break;
        }
      }
    }
  
    const updated = [...new Set([...completedDocuments, ...newMatches])];
    setCompletedDocuments(updated);
    setDocumentDates(newDates);
  
    return newMatches;
  };
  
  const validateRDDFromExtractedDate = (extractedDateStr) => {
    const rdd = getRDDDate(quarter, year);
  
    if (!rdd) {
      setRDDValidationMessage('⚠️ Unable to determine RDD.');
      return;
    }
  
    const formattedRDD = new Date(
      rdd.getFullYear(),
      rdd.getMonth(),
      rdd.getDate()
    ).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    
  
    if (!extractedDateStr) {
      setRDDValidationMessage(`⚠️ No date found in document. Your RDD is ${formattedRDD}.`);
      return;
    }
  
    const parts = extractedDateStr.split('/');
    const docDate = new Date(parts[2], parts[0] - 1, parts[1]);
  
    if (docDate <= rdd) {
      setRDDValidationMessage(`✅ Document appears issued before your RDD (${formattedRDD}).`);
    } else {
      setRDDValidationMessage(`⚠️ Document may be issued AFTER your RDD (${formattedRDD})! Risky!`);
    }
  };
  
  useEffect(() => {
    if (checklistComplete) {
      setEligibility(true);
    }
  }, [checklistComplete]);

  const validateLeaseCoverage = () => {
    const rdd = getRDDDate(quarter, year);
    if (!rdd || !leaseStartDate || !leaseEndDate) {
      setLeaseValidationMessage('');
      return;
    }
  
    const start = new Date(leaseStartDate);
    const end = new Date(leaseEndDate);
  
    const formattedRDD = new Date(
      rdd.getFullYear(),
      rdd.getMonth(),
      rdd.getDate()
    ).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  
    if (start <= rdd && end >= rdd) {
      setLeaseValidationMessage(`✅ Your lease appears to cover your RDD (${formattedRDD}).`);
    } else {
      setLeaseValidationMessage(`⚠️ Your lease does NOT cover your RDD (${formattedRDD}). Please upload another document.`);
    }
  };
  
  function renderChecklistAndUpload() {
    const rdd = getRDDDate(quarter, year);
    const formattedRDD = rdd
      ? rdd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
  
      const stepProgress = Math.round((checklistStep / 3) * 100);
      const residencyProgress = Math.min(Math.round((completedDocuments.length / 3) * 100), 100);
      const taxProgress = Math.min(Math.round((financialDocs.length / 3) * 100), 100);
      
  
    return (
      <div className="py-6">
        {/* Shared Progress Header */}
        <div style={{ maxWidth: '700px', margin: '0 auto 1rem', textAlign: 'center' }}>
          <div style={{ color: '#28a745', fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Step {checklistStep} of 3
          </div>
          <div style={{
            height: '12px',
            backgroundColor: '#e0e0e0',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            <div
              style={{
                width: `${stepProgress}%`,
                backgroundColor: '#28a745',
                height: '100%',
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>
        </div>
  
        {/* STEP 1 */}
        {checklistStep === 1 && (
          <div style={{
            backgroundColor: '#ffffffdd',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '700px',
            margin: '2rem auto',
            color: '#154734'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📅 Select the Quarter and Year</h3>
            <form onSubmit={(e) => { e.preventDefault(); setChecklistStep(2); }}>
              <label style={{ display: 'block', marginBottom: '1rem' }}>
                Quarter:
                <select value={quarter} onChange={(e) => setQuarter(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px' }}>
                  <option value="">-- Select Quarter --</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: '1rem' }}>
                Year:
                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px' }}>
                  <option value="">-- Select Year --</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </label>
              <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                Next
              </button>
            </form>
          </div>
        )}
  
        {/* STEP 2 */}
        {checklistStep === 2 && (
          <div style={{
            backgroundColor: '#ffffffdd',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '700px',
            margin: '2rem auto',
            color: '#154734'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📁 Upload Your Residency Documents</h3>
            <p style={{ marginBottom: '1rem' }}>
              Please upload <strong>at least 1 document from List A</strong> and <strong>at least 2 other documents from either List A or B</strong>. You must upload a minimum of 3 Documents total.<strong> </strong> <br />
              Make sure the issue dates are before your RDD of <strong>{formattedRDD}</strong>.
            </p>

               {/* Mini progress bar for residency */}
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#154734' }}>
        <span>{completedDocuments.length}/3 residency docs</span>
        <span>{residencyProgress}% complete</span>
      </div>
      <div style={{
        height: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '6px',
        marginTop: '6px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
      }}>
        <div
          style={{
            width: `${residencyProgress}%`,
            backgroundColor: '#154734',
            height: '100%',
            transition: 'width 0.5s ease-in-out'
          }}
          title={`${residencyProgress}% complete`}
        ></div>
      </div>
    </div>

            <ResidencyDocsChecklist
              residencyType={residencyType}
              completedItems={completedDocuments}
              documentDates={documentDates}
              setDocumentDates={setDocumentDates}
              petitionYear={year}
              onChecklistComplete={(done) => setChecklistComplete(done)}
            />
            <FileUploadArea
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              confirmUpload={confirmUpload}
              handleAnalyzeFile={handleAnalyzeFile}
              extractedDates={extractedDates}
              currentSelectedDate={currentSelectedDate}
              setCurrentSelectedDate={setCurrentSelectedDate}
              leaseStartDate={leaseStartDate}
              leaseEndDate={leaseEndDate}
              setLeaseStartDate={setLeaseStartDate}
              setLeaseEndDate={setLeaseEndDate}
              uploadMessage={uploadMessage}
              rddValidationMessage={rddValidationMessage}
              documentTypes={documentTypes}
              validateRDDFromExtractedDate={validateRDDFromExtractedDate}
              analysisInfo={analysisInfo}
            />
            {checklistComplete && (
              <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                <button onClick={() => setChecklistStep(3)} style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}
  
        {/* STEP 3 */}
        {checklistStep === 3 && (
          <div style={{
            backgroundColor: '#ffffffdd',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '700px',
            margin: '2rem auto',
            color: '#154734'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>💵 Upload Parent Tax Returns</h3>
            <p style={{ marginBottom: '1rem' }}>
              Now it's time to upload your parent's tax returns to prove financial independence.
            </p>

            {/* Mini progress bar for tax docs */}
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#154734' }}>
        <span>{financialDocs.length}/3 tax returns</span>
        <span>{taxProgress}% complete</span>
      </div>
      <div style={{
        height: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '6px',
        marginTop: '6px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
      }}>
        <div
          style={{
            width: `${taxProgress}%`,
            backgroundColor: '#154734',
            height: '100%',
            transition: 'width 0.5s ease-in-out'
          }}
          title={`${taxProgress}% complete`}
        ></div>
      </div>
    </div>

            <TaxDocsChecklist
              petitionYear={year}
              residencyType={residencyType}
              financialDocs={financialDocs}
              setFinancialDocs={setFinancialDocs}
            />
            <FileUploadArea
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              confirmUpload={confirmUpload}
              handleAnalyzeFile={handleAnalyzeFile}
              extractedDates={extractedDates}
              currentSelectedDate={currentSelectedDate}
              setCurrentSelectedDate={setCurrentSelectedDate}
              leaseStartDate={leaseStartDate}
              leaseEndDate={leaseEndDate}
              setLeaseStartDate={setLeaseStartDate}
              setLeaseEndDate={setLeaseEndDate}
              uploadMessage={uploadMessage}
              rddValidationMessage={rddValidationMessage}
              documentTypes={documentTypes}
              validateRDDFromExtractedDate={validateRDDFromExtractedDate}
              analysisInfo={analysisInfo}
            />
          </div>
        )}
      </div>
    );
  }
    
  return (
    <div className="App min-h-screen bg-[#121212] text-white font-sans">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              status={status}
              quizCompleted={quizCompleted}
              residencyType={residencyType}
              quizAnswers={quizAnswers}
              setResidencyType={setResidencyType}
              setQuizAnswers={setQuizAnswers}
              setQuizCompleted={setQuizCompleted}
              renderChecklistAndUpload={renderChecklistAndUpload}
            />
          }
        />
        <Route
          path="/review"
          element={<QuizReviewPage quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers} />} />
      </Routes>
    </div>
  );
}

export default App;
