# Residency Navigator

Residency Navigator is a web-based assistant designed to help Cal Poly students navigate the complex process of reclassifying as California residents for tuition purposes.

Built with a full-stack architecture (React + Node.js + Express), this application provides **dynamic, personalized guidance** through eligibility checks, document uploads, RDD validation, and progress tracking.

---

## Why This Project?
Every year, many students miss out on in-state tuition because the residency reclassification process is confusing and intimidating. Residency Navigator brings clarity by acting as:
- A **quiz** to determine your residency category
- A **checklist builder** tailored to your category
- A **progress tracker** based on document uploads
- A **smart analyzer** for your documents (extracts keywords and dates)
- An **eligibility estimator** based on CSU rules

---

## Features
### Residency Category Quiz
- Interactive 10-question quiz to classify students as:
  - Independent
  - Dependent under 19
  - Military
  - Above 19 Dependent on CA parents (new!)
  - Above 19 Dependent on Non-CA parents (new! → shows ineligibility + tips)

### Dynamic Document Checklist
- Checklist changes based on your quiz results.
- Customizes requirements for List A and List B documents.
- Updates live as you upload files.

### Live Progress Tracker
- Real-time progress bar showing how close you are to checklist completion.

### PDF Upload + Analysis
- Upload any supporting document (ID, lease, tax return, etc.)
- The backend extracts:
  - Number of pages
  - Snippets of text
  - Detected keywords
  - Detected dates (for RDD validation)

### Residency Determination Date (RDD) Validation
- Automatically checks if a document is **older than the required RDD** (e.g., CA ID must be issued before RDD).
- Alerts if a document might be issued **after** RDD, marking it as risky.

### Intelligent Eligibility Feedback
- Dynamically calculates your eligibility status based on:
  - Quiz answers
  - Document checklist progress
  - Uploaded document dates

### Personalized Suggestions (NEW)
- If you're not currently eligible (e.g., dependent on non-CA parents), the system suggests realistic ways to become eligible (e.g., gain financial independence, parents move to CA, marriage, etc.).

---

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **File Uploads:** Multer
- **PDF Parsing:** pdf-parse
- **Version Control:** Git + GitHub

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/itsjinihere/residency-navigator
cd residency-navigator
```

### 2. Start the Backend
```bash
cd server
npm install
npm run dev
```

### 3. Start the Frontend
```bash
cd ../client
npm install
npm run dev
```

Both the server and client should now be running locally!

---

## Current Progress
- 10% prototype completed (Week 4)
- 20% prototype completed (Week 5)
- Residency quiz and dynamic checklist
- RDD validation
- Smart file upload and keyword detection
- Live eligibility updates

---

## Future Plans
- Smarter text extraction for RDD validation (not just from filenames)
- Allow users to edit or delete uploaded documents
- Track multiple documents per checklist item
- Admin dashboard to review user submissions (future phase)

---

