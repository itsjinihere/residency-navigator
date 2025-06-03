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
  'Military ID': [
  'military id',
  'uniformed services',
  'department of defense',
  'dod id',
  'geneva conventions identification card',
  'geneva conventions',
  'rank lt',
  'affiliation: uniformed services',
  'agency/department: air force',
  'air force',
  'affiliation',
  'agency/department',
  'id card (dd form 2)',
  'dd form 2',
  'armed forces of the united states',
  'armed forces id'
],
'LES (Leave and Earnings Statement)': [
  'leave and earnings statement',
  'les-djms',
  'defense finance and accounting service',
  'dfas form 702',
  'meal deduction',
  'base pay',
  'bah',
  'bas',
  'entitlements',
  'deductions',
  'summary',
  'sgli coverage amount',
  'jpmorgan chase bank, na',
  'dfas.mil',
  'pay data',
  'federal taxes',
  'bah',
  'bas',
  'mid-month-pay'
],
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

const isMilitaryStudent = (residencyType) =>
  residencyType?.toLowerCase().replace(/-/g, '') === 'military';


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

function getTotalCoveredDays(ranges, rdd) {
  if (!ranges.length || !rdd) return 0;

  const rddStart = new Date(rdd);
  const rddEnd = new Date(rdd);
  rddEnd.setFullYear(rddEnd.getFullYear() + 1);

  const clippedRanges = ranges
    .map(({ start, end }) => {
      const docStart = new Date(start);
      const docEnd = new Date(end);

      const clippedStart = docStart < rddStart ? rddStart : docStart;
      const clippedEnd = docEnd > rddEnd ? rddEnd : docEnd;

      if (clippedStart > clippedEnd) return null; // No overlap

      return { start: clippedStart, end: clippedEnd };
    })
    .filter(Boolean) // remove nulls
    .sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const merged = [];
  for (const range of clippedRanges) {
    if (!merged.length) {
      merged.push(range);
    } else {
      const last = merged[merged.length - 1];
      if (range.start <= last.end) {
        last.end = new Date(Math.max(last.end, range.end));
      } else {
        merged.push(range);
      }
    }
  }

  return merged.reduce((sum, { start, end }) => {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return sum + days;
  }, 0);
}





function App() {

  const navigate = useNavigate();

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
  const [physicalPresenceRanges, setPhysicalPresenceRanges] = useState([]);
  const [showPhysicalDates, setShowPhysicalDates] = useState(false);



 





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
      const isLikely1040 = ['form 1040', 'irs form 1040', 'u.s. individual income tax return'].some(kw => text.includes(kw));
      const isNotLES = !['leave and earnings statement', 'dfas', 'les-djms'].some(kw => text.includes(kw));
      
      const isTaxReturn = isLikely1040 && isNotLES;
      
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
    // If it's Step 4 and a physical presence doc, add the range
if (checklistStep === 4 && leaseStartDate && leaseEndDate) {
  const newRange = { start: leaseStartDate, end: leaseEndDate };
const alreadyExists = physicalPresenceRanges.some(
  r => r.start === newRange.start && r.end === newRange.end
);
if (!alreadyExists) {
  setPhysicalPresenceRanges(prev => [...prev, newRange]);
}

}

  
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
  
      const nextYearRDD = rdd
  ? new Date(rdd.getFullYear() + 1, rdd.getMonth(), rdd.getDate()).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  : 'N/A';

  const totalSteps = isMilitaryStudent(residencyType) ? 2 : 5;
const displayStepNumber = isMilitaryStudent(residencyType)
  ? checklistStep === 5 ? 3 : checklistStep
  : checklistStep;
const stepProgress = Math.round((displayStepNumber / (isMilitaryStudent(residencyType) ? 3 : totalSteps)) * 100);

  
  const residencyDocTarget = isMilitaryStudent(residencyType) ? 1 : 3;
  const residencyProgress = Math.min(Math.round((completedDocuments.length / residencyDocTarget) * 100), 100);
        const taxProgress = Math.min(Math.round((financialDocs.length / 3) * 100), 100);
      
  
    return (
      <div className="py-6">
        {/* Shared Progress Header */}
        <div style={{ maxWidth: '700px', margin: '0 auto 1rem', textAlign: 'center' }}>
        <div style={{ color: '#28a745', fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
  Step {displayStepNumber} of {isMilitaryStudent(residencyType) ? 3 : totalSteps}
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
            {/* Description below the heading */}
    <p style={{ marginBottom: '1.5rem', color: '#154734', fontSize: '0.95rem' }}>
      Choose the quarter that you're seeking to reclassify as a California resident for tuition purposes.
    </p>

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
  {isMilitaryStudent(residencyType) ? (
    <>As a military-affiliated student, you only need to upload <strong>one document from List A</strong>.</>
  ) : (
    <>
      Please upload <strong>at least 1 document from List A</strong> and <strong>at least 2 other documents from either List A or B</strong>. You must upload a minimum of 3 documents total.
    </>
  )} <br />
  Make sure the issue dates are before your RDD of <strong>{formattedRDD}</strong>.
</p>


               {/* Mini progress bar for residency */}
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#154734' }}>
      <span>
  {completedDocuments.length}/{isMilitaryStudent(residencyType) ? 1 : 3} residency doc{isMilitaryStudent(residencyType) ? '' : 's'}
</span>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
  <button
    onClick={() => setChecklistStep(1)}
    style={{
      backgroundColor: '#ccc',
      color: '#154734',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontWeight: 'bold',
    }}
  >
    ← Back
  </button>

  {checklistComplete && (
  <button
    onClick={() => setChecklistStep(isMilitaryStudent(residencyType) ? 5 : 3)}
    style={{
      backgroundColor: '#28a745',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontWeight: 'bold',
    }}
  >
    Next →
  </button>
)}

</div>

          </div>
        )}
  
        {/* STEP 3 */}
        {checklistStep === 3 && !isMilitaryStudent(residencyType) && (
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
              {/* ← Back Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
  <button
    onClick={() => setChecklistStep(2)}
    style={{
      backgroundColor: '#ccc',
      color: '#154734',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontWeight: 'bold',
    }}
  >
    ← Back
  </button>

  {/* Only show next button if 3 tax docs uploaded */}
  {financialDocs.length >= 3 && (
    <button
      onClick={() => setChecklistStep(4)}
      style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontWeight: 'bold',
      }}
    >
      Next →
    </button>
  )}
</div>

  </div>
        )}
      {/* STEP 4 */}
      {checklistStep === 4 && !isMilitaryStudent(residencyType) && (
  <div style={{
    backgroundColor: '#ffffffdd',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '700px',
    margin: '2rem auto',
    color: '#154734'
  }}>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
      📍 Physical Presence in California
    </h3>

    <p style={{ marginBottom: '1rem' }}>
      You must provide documents showing you have lived in California continuously from <strong>{formattedRDD}</strong> to <strong>{nextYearRDD}</strong>.
    </p>

    {/* File Picker */}
    <input
      type="file"
      onChange={(e) => {
        setSelectedFile(e.target.files[0]);
        setShowPhysicalDates(true);
      }}
      className="mb-3"
    />

    {/* Show date pickers only after file is selected */}
    {showPhysicalDates && (
      <>
        <label>Start Date:</label>
        <input
          type="date"
          onChange={(e) => setLeaseStartDate(e.target.value)}
          value={leaseStartDate}
          className="rounded px-2 py-1 text-black mb-2"
        />
        <label>End Date:</label>
        <input
          type="date"
          onChange={(e) => setLeaseEndDate(e.target.value)}
          value={leaseEndDate}
          className="rounded px-2 py-1 text-black mb-2"
        />
        <button
          onClick={confirmUpload}
          style={{ backgroundColor: '#154734', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', marginBottom: '1rem' }}
        >
          📤 Upload
        </button>
      </>
    )}

    {rddValidationMessage && (
      <p style={{ color: rddValidationMessage.includes("⚠️") ? 'red' : 'green' }}>
        {rddValidationMessage}
      </p>
    )}
    {uploadMessage && (
      <p style={{ color: uploadMessage.includes("❌") ? 'red' : 'green' }}>
        {uploadMessage}
      </p>
    )}

    <div style={{ marginBottom: '1rem' }}>
      <strong>Uploaded Ranges:</strong>
      <ul>
        {physicalPresenceRanges.map((r, i) => (
          <li key={i}>{r.start} to {r.end}</li>
        ))}
      </ul>
    </div>

    {/* Progress bar */}
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span>{getTotalCoveredDays(physicalPresenceRanges, rdd)} / 365 days covered</span>
      <span>{Math.min(Math.round((getTotalCoveredDays(physicalPresenceRanges, rdd) / 365) * 100), 100)}% complete</span>
      </div>
      <div style={{
        height: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '6px',
        marginTop: '6px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
      }}>
        <div style={{

width: `${Math.min((getTotalCoveredDays(physicalPresenceRanges, rdd) / 365) * 100, 100)}%`,
backgroundColor: '#154734',
          height: '100%',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
    </div>

    {/* Back Button */}
    <div style={{ marginTop: '1rem' }}>
      <button
        onClick={() => setChecklistStep(3)}
        style={{
          backgroundColor: '#ccc',
          color: '#154734',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontWeight: 'bold',
        }}
      >
        ← Back
      </button>
      {/* Show Next button ONLY when 365+ days are covered */}
{getTotalCoveredDays(physicalPresenceRanges, rdd) >= 365 && (
  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
    <button
      onClick={() => setChecklistStep(5)}
      style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontWeight: 'bold',
      }}
    >
      Next →
    </button>
  </div>
)}

    </div>
  </div>
)}
{checklistStep === 5 && (
  <div style={{
    backgroundColor: '#ffffffdd',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '700px',
    margin: '2rem auto',
    color: '#154734',
    textAlign: 'center'
  }}>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🎉 You're All Done!</h3>
    {isMilitaryStudent(residencyType) ? (
  <>
    <p style={{ fontSize: '1.1rem' }}>
      As a military-affiliated student, you qualify for in-state tuition with fewer requirements.
    </p>
    <p style={{ marginTop: '1rem' }}>
      Your uploaded documentation confirms your military status and California connection. Thank you for your service!
    </p>
  </>
) : (
  <>
    <p style={{ fontSize: '1.1rem' }}>
      You’ve completed all 4 steps for the residency reclassification process.
    </p>
    <p style={{ marginTop: '1rem' }}>
      Your documents have been uploaded and analyzed, and you have successfully provided proof of California residency and physical presence.
    </p>
  </>
)}

    <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
      ✅ Congratulations!
    </p>
    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
    <button
  onClick={() => setChecklistStep(isMilitaryStudent(residencyType) ? 2 : 4)}
  style={{
    backgroundColor: '#ccc',
    color: '#154734',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    fontWeight: 'bold',
  }}
>
  ← Back to Step {isMilitaryStudent(residencyType) ? 2 : 4}
</button>


  <button
  onClick={() => {
    setChecklistStep(1);
    setQuizCompleted(false);  // This makes HomePage render the Quiz
    setQuizAnswers({});       // Optional: clear previous quiz data
  }}
  style={{
    backgroundColor: '#28a745',
    color: 'white',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    fontWeight: 'bold',
  }}
>
  Return to Home
</button>



</div>

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
        <Route path="/quiz" element={
    <Quiz
      residencyType={residencyType}
      setResidencyType={setResidencyType}
      quizAnswers={quizAnswers}
      setQuizAnswers={setQuizAnswers}
      setQuizCompleted={setQuizCompleted}
    />
  } />

        <Route
          path="/review"
          element={<QuizReviewPage quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers} />} />
      </Routes>
    </div>
  );
}

export default App;
