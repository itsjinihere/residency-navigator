import { useEffect, useState } from 'react';
import Quiz from './Quiz';
import Checklist from './Checklist';
import './App.css';

const keywordMappings = {
  'CA Driver\'s License or ID': ['driver license', 'driver\'s license', 'id card'],
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

// Helper to get RDD for given quarter/year
const getRDDDate = (quarter, year) => {
  if (!quarter || !year) return null;

  const rddYear = Number(year) - 1; // 🛠 SUBTRACT 1 YEAR

  switch (quarter) {
    case 'Fall': return new Date(`${rddYear}-09-20`);  // ✅ September 20
    case 'Winter': return new Date(`${rddYear}-01-05`); // ✅ January 5
    case 'Spring': return new Date(`${rddYear}-04-01`); // ✅ April 1
    case 'Summer': return new Date(`${rddYear}-07-01`); // ✅ July 1
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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadMessage('');
    setAnalysisInfo(null);
    setRDDValidationMessage('');

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

      matchUploadedDocument(analysisData.textSnippet, uploadData.filename);

      validateRDDFromExtractedDate(analysisData.extractedDate);

    } catch (err) {
      console.error("Upload or analysis error:", err);
      setUploadMessage('❌ Failed to upload or analyze file.');
    }
  };

  const matchUploadedDocument = (textSnippet, filename) => {
    const lowerText = textSnippet.toLowerCase() + ' ' + filename.toLowerCase();
    const newMatches = [];

    for (const [docName, keywords] of Object.entries(keywordMappings)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          newMatches.push(docName);
          break;
        }
      }
    }

    setCompletedDocuments(prev => [...new Set([...prev, ...newMatches])]);
  };

  const validateRDDFromExtractedDate = (extractedDateStr) => {
    const rdd = getRDDDate(quarter, year);

    if (!rdd) {
      setRDDValidationMessage('⚠️ Unable to determine RDD.');
      return;
    }

    if (!extractedDateStr) {
      setRDDValidationMessage('⚠️ No date found in document.');
      return;
    }

    const parts = extractedDateStr.split('/');
    const docDate = new Date(parts[2], parts[0] - 1, parts[1]); // MM/DD/YYYY -> Date(year, monthIndex, day)

    if (docDate <= rdd) {
      setRDDValidationMessage('✅ Document appears issued before RDD.');
    } else {
      setRDDValidationMessage('⚠️ Document may be issued AFTER RDD! Risky!');
    }
  };

  useEffect(() => {
    if (checklistComplete) {
      setEligibility(true);
    }
  }, [checklistComplete]);

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
            onChecklistComplete={setChecklistComplete}
          />

          <hr />
          <h3>Upload Supporting Document</h3>
          <input type="file" onChange={handleUpload} />
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

          {rddValidationMessage && (
            <div style={{ marginTop: '1rem', fontWeight: 'bold', color: rddValidationMessage.includes('⚠️') ? 'red' : 'green' }}>
              {rddValidationMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
