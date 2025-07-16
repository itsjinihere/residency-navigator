const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js'); 
const { PDFDocument, StandardFonts } = require('pdf-lib');


const app = express();
const PORT = 3000;

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

// Routes
app.get('/ping', (req, res) => res.send('pong'));

app.get('/', (req, res) => {
  res.send('Welcome to Residency Navigator backend!');
});

app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is working', timestamp: new Date().toISOString() });
});

app.post('/api/submit', (req, res) => {
  const { residencyType, quarter, year } = req.body;
  console.log('Received submission:', { residencyType, quarter, year });

  let eligibility = false;
  if (!residencyType || !quarter || !year) {
    return res.status(400).json({ message: 'Missing fields in submission.' });
  }

  if (residencyType === 'under19') {
    eligibility = Number(year) >= 2024;
  } else if (residencyType === 'independent') {
  } else if (residencyType === 'independent' || residencyType === 'independent-over24') {
    eligibility = ['fall', 'winter'].includes(quarter.toLowerCase());
  } else if (residencyType === 'military') {
    eligibility = true;
  }

  res.json({ message: `Submission received for ${residencyType}`, eligibility });
});

// Upload a file
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

// Analyze uploaded file (PDF or image)
app.post('/api/analyze', async (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ message: 'No file path provided' });

  const ext = path.extname(filePath).toLowerCase();

  try {
    let text = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const result = await Tesseract.recognize(filePath, 'eng', {
        tessedit_pageseg_mode: 6,
        logger: m => console.log(m)
      });
      text = result.data.text;
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    // Normalize all line breaks and reduce noise
    text = text.replace(/\r\n|\r|\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    console.log('Extracted Text:', text.slice(0, 500));

    // Extract all date formats
    const mmddyyyy = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || [];
    const yyyymmdd = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
    const longDate = text.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi) || [];

    // Convert all extracted dates to MM/DD/YYYY
    const normalizedDates = new Set();

    mmddyyyy.forEach(d => normalizedDates.add(d));
    yyyymmdd.forEach(d => {
      const [y, m, d2] = d.split('-');
      normalizedDates.add(`${parseInt(m)}/${parseInt(d2)}/${y}`);
    });
    longDate.forEach(d => {
      const date = new Date(d);
      if (!isNaN(date)) {
        normalizedDates.add(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);
      }
    });

    const taxYearMatches = text.match(/\b20(2[0-9])\b/g);
    const taxYears = taxYearMatches ? Array.from(new Set(taxYearMatches)) : [];

    const keywords = [
      'California ID', 'California', 'lease', 'utility bill',
      'driver’s license', 'voter registration', 'vote-by-mail',
      'form 1040', 'u.s. individual income tax return', 'irs', 'tax return'
    ];
    
    const foundKeywords = keywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log('Extracted Tax Years:', taxYears);

    res.json({
      message: 'Document analyzed successfully!',
      foundKeywords,
      taxYears,
      textSnippet: text.slice(0, 500),
      extractedDates: Array.from(normalizedDates),
      pageCount: ext === '.pdf' ? undefined : 'N/A'
    });
  } catch (err) {
    console.error('Document analysis error:', err);
    res.status(500).json({ message: 'Error analyzing document' });
  }
});

// Merge all uploaded documents into a single PDF with a cover email
app.post('/api/export', async (req, res) => {
  const { emailText = '' } = req.body;
  const uploadsDir = path.join(__dirname, 'uploads');

  try {
    const pdfDoc = await PDFDocument.create();

    // Add email text as first page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize + 4;
    const maxWidth = width - 100; // 50 padding on each side

    const lines = emailText.split('\n');
    let y = height - 50;

    lines.forEach(line => {
      const words = line.split(' ');
      let currentLine = '';
      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth > maxWidth) {
          page.drawText(currentLine, { x: 50, y, size: fontSize, font });
          currentLine = word + ' ';
          y -= lineHeight;

          if (y < 50) { // Create new page if text exceeds page height
            y = height - 50;
            page = pdfDoc.addPage();
          }
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine.trim()) {
        page.drawText(currentLine.trim(), { x: 50, y, size: fontSize, font });
        y -= lineHeight;
        if (y < 50) {
          y = height - 50;
          page = pdfDoc.addPage();
        }
      }
    });

    // Append all uploaded documents
    const files = fs.readdirSync(uploadsDir).map(f => path.join(uploadsDir, f));

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      const buffer = fs.readFileSync(filePath);

      if (ext === '.pdf') {
        const donor = await PDFDocument.load(buffer);
        const copied = await pdfDoc.copyPages(donor, donor.getPageIndices());
        copied.forEach(p => pdfDoc.addPage(p));
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const img = ext === '.png' ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
        const imgPage = pdfDoc.addPage([img.width, img.height]);
        imgPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="residency_packet.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Error creating PDF packet' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
