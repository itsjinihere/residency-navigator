const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads/ folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Health check
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/', (req, res) => {
  res.send('Welcome to Residency Navigator backend!');
});

app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is working', timestamp: new Date().toISOString() });
});

// Reclassification form (updated to capture year)
app.post('/api/submit', (req, res) => {
  const { residencyType, quarter, year } = req.body;
  console.log('Received submission:');
  console.log('Residency Type:', residencyType);
  console.log('Quarter:', quarter);
  console.log('Year:', year);

  let eligibility = false;

  if (!residencyType || !quarter || !year) {
    return res.status(400).json({ message: 'Missing fields in submission.' });
  }

  // Cleaner eligibility logic
  if (residencyType === 'under19') {
    eligibility = Number(year) >= 2024;
  } else if (residencyType === 'independent') {
    eligibility = ['fall', 'winter'].includes(quarter.toLowerCase());
  } else if (residencyType === 'military') {
    eligibility = true;
  }

  res.json({
    message: `Submission received for ${residencyType} reclassification.`,
    eligibility,
  });
});

// Upload a PDF
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  console.log('Stored file at:', req.file.path);
  res.json({
    message: 'File uploaded successfully!',
    filename: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    type: req.file.mimetype
  });
});

// Analyze uploaded PDF and extract ALL dates
app.post('/api/analyze', async (req, res) => {
  const { path: filePath } = req.body;

  if (!filePath) return res.status(400).json({ message: 'No file path provided' });

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const keywords = ['California ID', 'California', 'lease', 'utility bill', 'driver’s license'];
    const foundKeywords = keywords.filter(keyword =>
      data.text.toLowerCase().includes(keyword.toLowerCase())
    );

    // Extract all MM/DD/YYYY style dates
    const matches = data.text.match(/\d{2}\/\d{2}\/\d{4}/g) || [];

    res.json({
      message: 'Document analyzed successfully!',
      pageCount: data.numpages,
      foundKeywords,
      textSnippet: data.text.slice(0, 500),
      extractedDates: matches
    });
  } catch (err) {
    console.error('PDF analysis error:', err);
    res.status(500).json({ message: 'Error analyzing document' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
