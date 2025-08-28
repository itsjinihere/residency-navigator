const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js'); 
const { PDFDocument, StandardFonts } = require('pdf-lib');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth'); // <- new route
const requireAuth = require('./middleware/authMiddleware');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

//MONGO_URI=mongodb://127.0.0.1:27017/residency npm start

app.use('/api/auth', authRoutes);


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

app.post('/api/submit', requireAuth, (req, res) => {
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
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
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
app.post('/api/analyze', requireAuth, async (req, res) => {
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
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add email cover page
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const lineHeight = fontSize + 4;
    const maxWidth = width - 100;
    let y = height - 50;

    const lines = emailText.split('\n');
    for (const line of lines) {
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth) {
          page.drawText(currentLine, { x: 50, y, size: fontSize, font });
          currentLine = word + ' ';
          y -= lineHeight;
          if (y < 50) {
            page = pdfDoc.addPage();
            y = height - 50;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine.trim()) {
        page.drawText(currentLine.trim(), { x: 50, y, size: fontSize, font });
        y -= lineHeight;
        if (y < 50) {
          page = pdfDoc.addPage();
          y = height - 50;
        }
      }
    }

    // Append uploaded files
    const files = fs.readdirSync(uploadsDir).map(f => path.join(uploadsDir, f));
    console.log('🧩 Processing uploaded files:', files);

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      const stats = fs.statSync(filePath);
      if (stats.size === 0) continue;

      const buffer = fs.readFileSync(filePath);

      if (ext === '.pdf') {
        try {
          const donor = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const copied = await pdfDoc.copyPages(donor, donor.getPageIndices());
          copied.forEach(p => pdfDoc.addPage(p));
        } catch (err) {
          console.warn('❌ Could not load PDF:', filePath, '→ Falling back to image:', err.message);

          // ✅ Fallback: convert PDF to PNGs and embed
          try {
            const { pdfToPng } = await import('pdf-to-img');
            const images = await pdfToPng(filePath);
            for (const imgData of images) {
              const imgBuffer = fs.readFileSync(imgData.path);
              const image = await pdfDoc.embedPng(imgBuffer);
              const imgPage = pdfDoc.addPage([image.width, image.height]);
              imgPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }
          } catch (imgErr) {
            console.warn('⚠️ Fallback to image failed:', imgErr.message);
            continue;
          }
        }
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        try {
          const image = ext === '.png'
            ? await pdfDoc.embedPng(buffer)
            : await pdfDoc.embedJpg(buffer);
          const imgPage = pdfDoc.addPage([image.width, image.height]);
          imgPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        } catch (err) {
          console.warn('⚠️ Image embed failed:', filePath, err.message);
          continue;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="residency_packet.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('❌ PDF export error:', err.message);
    return res.status(500).json({ message: 'Error creating PDF packet' });
  }
});

// ------------------ Serve React build in production ------------------
const clientBuildPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}








app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
