import { useEffect, useState } from 'react';
import Quiz from './Quiz';
import Checklist from './Checklist';
import './App.css';

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
  'Utility Bill at CA address': ['utility bill']
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
      setDocumentTypes({ isLease, isGeneralResidency: true });
  
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
  
    const matchedDocs = matchUploadedDocument(
      analysisInfo.textSnippet,
      selectedFile.name
    );
  
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
    return (
      <>
        <form onSubmit={handleSubmit}>
          <label>
            Select Quarter:
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)} required>
              <option value="">-- Select Quarter --</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </label>
  
          <br /><br />
  
          <label>
            Select Year:
            <select value={year} onChange={(e) => setYear(e.target.value)} required>
              <option value="">-- Select Year --</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </label>
  
          <br /><br />
          <button type="submit">Submit</button>
        </form>
  
        <Checklist
          residencyType={residencyType}
          completedItems={completedDocuments}
          documentDates={documentDates}
          setDocumentDates={setDocumentDates}
          onChecklistComplete={setChecklistComplete}
        />  
  
        {rddValidationMessage && (
          <div
            style={{
              marginTop: '1rem',
              fontWeight: 'bold',
              color: rddValidationMessage.includes('⚠️') ? 'red' : 'green'
            }}
          >
            {rddValidationMessage}
          </div>
        )}
  
        <hr />
        <h3>Upload Supporting Document</h3>
        <input
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file); // store for later upload
    handleAnalyzeFile(file)
  }}
/>
{selectedFile && (
  <>
    {documentTypes.isLease && (
      <>
        <label>Start Date:</label>
        <input
          type="date"
          value={leaseStartDate}
          onChange={(e) => {
            //const formatted = new Date(e.target.value).toLocaleDateString('en-US');
            setLeaseStartDate(e.target.value);
          }}
        /><br />

        <label>End Date:</label>
        <input
          type="date"
          value={leaseEndDate}
          onChange={(e) => {
            //const formatted = new Date(e.target.value).toLocaleDateString('en-US');
            setLeaseEndDate(e.target.value);
          }}
        /><br />
      </>
    )}

    <label>Select document issue date (for checklist):</label>
    <select
      value={currentSelectedDate}
      onChange={(e) => {
        setCurrentSelectedDate(e.target.value);
        validateRDDFromExtractedDate(e.target.value);
      }}
      disabled={extractedDates.length === 0}
    >
      <option value="">-- Select a date --</option>
      {extractedDates.map((date, idx) => (
        <option key={idx} value={date}>{date}</option>
      ))}
    </select>

    <p style={{ marginTop: '10px' }}>Or manually enter the correct date:</p>
    <input
      type="date"
      onChange={(e) => {
        const [year, month, day] = e.target.value.split("-");
        const manual = `${parseInt(month)}/${parseInt(day)}/${year}`;
        setCurrentSelectedDate(manual);
        validateRDDFromExtractedDate(manual);
      }}
    />

    <button
      onClick={confirmUpload}
      disabled={
        !currentSelectedDate ||
        (documentTypes.isLease && (!leaseStartDate || !leaseEndDate))
      }
      style={{
        marginTop: '10px',
        backgroundColor: '#007bff',
        color: 'white',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Upload This Document
    </button>
  </>
)}

        {uploadMessage && (
          <p style={{
            marginTop: '10px',
            fontWeight: 'bold',
            color: uploadMessage.startsWith('✅') ? 'green' : 'red'
          }}>
            {uploadMessage}
          </p>
        )}
  
        {analysisInfo && (
          <div style={{ marginTop: '1rem' }}>
            <h4>📄 Document Analysis</h4>
            <p><strong>Pages:</strong> {analysisInfo.pageCount}</p>
            <p><strong>Keywords found:</strong> {analysisInfo.foundKeywords.join(', ') || 'None'}</p>
            <p><strong>Preview:</strong></p>
            <div style={{
              backgroundColor: '#f7f7f7',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <pre>{analysisInfo.textSnippet}</pre>
            </div>
          </div>
        )}
      </>
    );
  }
  
  
  return (
    <div className="App">
      <h1>Residency Navigator</h1>
      <p>Welcome to the prototype!</p>

      {status ? (
        <div>
          <p><strong>{status.message}</strong></p>
          <p>{status.timestamp}</p>
        </div>
      ) : (
        <p>Checking backend status...</p>
      )}

      <hr />

      {!quizCompleted ? (
        <Quiz
          onComplete={(determinedType) => {
            setResidencyType(determinedType);
            setQuizCompleted(true);
          }}
        />
      ) : (
        <>
          {residencyType === 'above19dependent-nonca' ? (
            <div style={{ marginTop: '2rem' }}>
              <h2>❌ Based on your answers, you are currently NOT eligible for California residency.</h2>
              <p>Because you are financially dependent on non-California parents, you are not considered a CA resident.</p>
              <h4>➡️ Ways you may become eligible in the future:</h4>
              <ul>
                <li>Become financially independent (file taxes independently, self-supporting income)</li>
                <li>Get married (may qualify you as independent)</li>
                <li>Your parents move to California and establish residency</li>
                <li>Live independently in California for 1+ year without being claimed on parents' taxes</li>
              </ul>
            </div>
          ) : residencyType === 'above19dependent-ca' ? (
            <div style={{ marginTop: '2rem' }}>
              <h2>⚠️ Based on your answers, your eligibility depends on your parents' California residency.</h2>
              <p>You are financially dependent but your parents are California residents. Please proceed to upload documents showing their CA status (tax returns, lease, ID, etc).</p>
              {renderChecklistAndUpload()}
            </div>
          ) : (
            renderChecklistAndUpload()
          )}
        </>
      )}
    </div>
  );
}

export default App;
