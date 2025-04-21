import { useEffect, useState } from 'react';
import './App.css';

// Checklist component
const Checklist = ({ residencyType }) => {
  if (!residencyType) return null;

  let items = [];

  if (residencyType === 'under19') {
    items = [
      '✔️ Parent/guardian moved to California',
      '✔️ Supporting documents submitted',
      '❌ Parent is financially responsible',
    ];
  } else if (residencyType === 'independent') {
    items = [
      '✔️ Lived in CA for 1 year',
      '❌ Filed taxes as independent',
      '❌ Financial independence proven',
    ];
  } else if (residencyType === 'military') {
    items = [
      '✔️ Active duty orders submitted',
      '✔️ Proof of CA stationing',
      '❌ Military spouse/child form submitted',
    ];
  }

  const completed = items.filter(item => item.startsWith('✔️')).length;
  const percent = Math.round((completed / items.length) * 100);

  return (
    <div>
      <h3>Checklist for {residencyType.charAt(0).toUpperCase() + residencyType.slice(1)} Student</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <p style={{ fontWeight: 'bold' }}>✅ Progress: {percent}% complete</p>
      <div style={{
        height: '10px',
        width: '100%',
        backgroundColor: '#eee',
        marginTop: '5px',
        borderRadius: '5px'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: percent === 100 ? 'green' : '#007bff',
          borderRadius: '5px'
        }} />
      </div>
    </div>
  );
};

function App() {
  const [status, setStatus] = useState(null);
  const [residencyType, setResidencyType] = useState('');
  const [quarter, setQuarter] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  const [uploadMessage, setUploadMessage] = useState('');
  const [analysisInfo, setAnalysisInfo] = useState(null);

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

    const formData = { residencyType, quarter };

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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      setUploadMessage(`✅ ${uploadData.filename} uploaded successfully (${Math.round(uploadData.size / 1024)} KB)`);

      // Analyze after upload
      const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: uploadData.path }),
      });

      const analysisData = await analyzeRes.json();
      setAnalysisInfo(analysisData);

    } catch (err) {
      console.error("Upload or analysis error:", err);
      setUploadMessage('❌ Failed to upload or analyze file.');
    }
  };

  return (
    <div className="App">
      <h1>Residency Navigator</h1>
      <p>Welcome to the 10% prototype!</p>

      {status ? (
        <div>
          <p><strong>{status.message}</strong></p>
          <p>{status.timestamp}</p>
        </div>
      ) : (
        <p>Checking backend status...</p>
      )}

      <hr />

      <form onSubmit={handleSubmit}>
        <label>
          Residency Type:
          <select value={residencyType} onChange={(e) => setResidencyType(e.target.value)} required>
            <option value="">-- Select --</option>
            <option value="under19">Under 19</option>
            <option value="independent">Independent</option>
            <option value="military">Military</option>
          </select>
        </label>

        <br /><br />

        <label>
          Reclassification Quarter:
          <input
            type="text"
            placeholder="e.g., Fall 2025"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            required
          />
        </label>

        <br /><br />
        <button type="submit">Submit</button>
      </form>

      <Checklist residencyType={residencyType} />

      {residencyType && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Eligibility Result</h3>
          {loading ? (
            <p style={{ color: 'gray' }}>⏳ Checking eligibility...</p>
          ) : eligibility !== null ? (
            eligibility ? (
              <p style={{ color: 'green', fontWeight: 'bold' }}>
                ✅ You may be eligible for residency reclassification!
              </p>
            ) : (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                ❌ You may not be eligible — please review the checklist and try again.
              </p>
            )
          ) : null}
        </div>
      )}

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
    </div>
  );
}

export default App;
