# Residency Navigator 

Residency Navigator is a web-based assistant designed to help Cal Poly students navigate the complex process of reclassifying as California residents for tuition purposes. Built with a full-stack MERN architecture, this application provides dynamic, personalized tools to guide students step-by-step through eligibility checks, document uploads, and progress tracking.

## Why This Project?

Every year, many students at Cal Poly miss out on potential in-state tuition because the reclassification process is opaque and intimidating. Residency Navigator brings clarity by acting as a **smart checklist, eligibility predictor, and document assistant** — all in one place.

## Features

-  **Live Progress Tracker**  
  See a real-time progress bar and checklist based on your residency type.

-  **Eligibility Estimator**  
  Backend logic determines likelihood of approval based on user inputs (e.g., term, status).

-  **PDF Upload + Analysis**  
  Users can upload supporting documents and get back extracted metadata, snippets, and keyword presence — laying the foundation for intelligent feedback.

-  **Checklist Customization**  
  Automatically adapts to “Under 19,” “Independent,” or “Military” residency types.

-  **Frontend–Backend Integration**  
  Frontend and backend communicate via REST API with live status checks and real-time form feedback.

-  **10% Prototype Complete**  
  Fully deployed local prototype with checklist logic, backend eligibility routes, file handling, and progress feedback.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js, Express
- **File Handling:** Multer
- **PDF Parsing:** Extracts metadata and content using pdf-parse
- **Version Control:** Git + GitHub

## Getting Started

```bash
# Clone the repo
git clone https://github.com/itsjinihere/residency-navigator
cd residency-navigator

# Start backend
cd server
npm install
npm run dev

# Start frontend
cd ../client
npm install
npm run dev
