# 🎓 Smart Career Portal with Resume Ranking

**Course Name:** Major Project | **Course Code:** BIS785  
**Semester:** VII | **Batch No:** B24  
**Guide:** Ms. Padma M T, Assistant Professor  
**Team Members:**   
- Kaushal Prakash (4NI23IS084)
- Jayantilal Mali (4NI23IS076)
- Aditya Raj (4NI23IS251)
- Ibaadur Rahman (4NI23IS073)

---

## 📖 Project Overview
The **Smart Career Portal with Resume Ranking** is an Artificial Intelligence-based hiring platform engineered to simplify and modernize the recruitment process. It bridges the gap between talented candidates and organizations by automating the tedious task of resume screening. 

Candidates can seamlessly upload their resumes and apply for roles, while administrators can post job roles with strict academic criteria (e.g., CGPA > 7.0). After the system automatically filters students based on CGPA eligibility, it uses AI to generate a **Skill Match Score** for the eligible applicants. By leveraging Natural Language Processing (NLP) and Cosine Similarity, it compares the applicant's parsed resume directly against the Job Description, helping companies instantly identify the most technically suitable candidates from the eligible pool.

### 💡 How the AI Match Score is Used
- **Smart Job Recommendations (For Students):** The ranking score powers a personalized job feed. Instead of a random list of companies, students see jobs sorted by their Match Score (e.g., "95% Match for Frontend Developer"), helping them focus their prep on roles they are technically suited for.
- **Trigger for Skill-Gap Analysis:** The ranking algorithm calculates the exact "delta" (missing skills) between the student's resume and the Job Description. This data is fed directly into the AI Copilot to generate hyper-personalized mock interviews and study plans, helping the student bridge the gap.

## 🎯 Core Objectives
- **AI Career Copilot & Mock Interviews**: Provide a conversational AI assistant that uses RAG to generate hyper-personalized interview prep and mock questions based on the student's unique resume and company history.
- **Automated Resume Screening**: Eliminate manual data entry by intelligently parsing PDF resumes to extract candidate skills and feed them directly into the AI engine.
- **Two-Tier Screening**: Automatically filter students based on hard academic eligibility (CGPA), then utilize NLP to generate skill-based Match Scores for the eligible pool.
- **Knowledge Sharing & Feedback Loop**: Cultivate a collaborative environment where placed alumni can easily share company-specific interview experiences and questions to guide juniors.
- **Dual Dashboard System**: Provide tailored, intuitive interfaces for both Job Seekers (Candidates) and Recruiters (Admins).
- **Data Visualization**: Offer interactive charts and insights into the candidate pool and hiring efficiency to aid organizational decision-making.

---

## ⭐ Key Features

### 1. Two-Tier Shortlisting: Academic Eligibility + AI Skill Matching
The system mimics real-world campus hiring. First, it strictly filters candidates based on company-defined academic criteria (e.g., minimum CGPA, no active backlogs). Then, for the *eligible* candidates, the AI dynamically generates a "Skill Match Score" *against the specific Job Description (JD)*. The NLP engine understands the *context* of skills (moving beyond simple keyword matching) to help admins instantly identify which eligible students are the best technical fit.

### 2. Alumni Experience Hub & Automated Feedback Loop
An integrated knowledge base where juniors can read real interview experiences from seniors. The system automatically triggers a feedback form to candidates once they are marked as "shortlisted" or "placed," ensuring a constantly growing, authentic database of company-specific interview insights.

### 3. Comprehensive Company Intelligence & Analytics
Students and admins can view detailed historical data for every visiting company. This includes past hiring trends, conversion rates (applied vs. placed), average packages, and the most frequently tested skills by that specific company.

### 4. AI Career Copilot (Conversational Assistant)
A built-in chatbot powered by Large Language Models (LLMs) and RAG (Retrieval-Augmented Generation). Students can ask questions like, "Based on my resume, what should I study for the upcoming Microsoft interview?" The AI combines the student's parsed resume with the company's historical feedback data to provide hyper-personalized advice.

### 5. Predictive Placement Analytics for Admins
An advanced analytics dashboard for the college placement cell that uses historical data to predict a student's "Placement Probability" early in the semester. This allows administrators to identify students who might struggle and provide targeted training interventions before the placement season begins.

### 6. Hyper-Personalized AI Mock Interviews & Skill-Gap Analysis
The system doesn't just give generic interview questions. It uses RAG (Retrieval-Augmented Generation) to combine three data points: **the specific Job Description, the student's individual resume, and historical interview questions asked by that company (pulled from the Alumni Feedback Hub)**. It then generates a 100% unique, hyper-targeted mock interview. For example, if the AI detects a gap in a student's Node.js knowledge for a Microsoft role, it will grill them on Node.js using actual variations of questions Microsoft has asked seniors in the past.

### 7. Institutional Policy & Offer Management (IIT-Style Workflow)
Inspired by top-tier institutions like the IITs, the portal acts as a strict Job Announcement Form (JAF) manager. It handles complex campus policies automatically, such as the "One-Student-One-Job" rule, instantly deregistering a student from future interview rounds once they accept an offer, or dynamically managing "Dream Company" upgrade policies based on CTC brackets.

### 8. Automated Interview Slotting & Conflict Resolution
During peak placement season (like Day 1), students often face overlapping interview times. The portal features an automated scheduling engine that cross-references recruiter availability with student schedules to prevent clashes, ensuring a smooth operational flow for the placement cell.

---

## 🛠️ System Architecture & Tech Stack

The platform is built on a robust, scalable 3-tier architecture:

### Frontend (Client-Side)
- **Framework:** Next.js (React)
- **Design:** Modern, responsive UI focusing on rich aesthetics, dynamic animations, and seamless user experience.

### Main Backend (API & Business Logic)
- **Framework:** Node.js with Express.js
- **Database:** MongoDB
- **Role:** Handles secure user authentication, job postings, application routing, and acts as the central hub communicating with the client and AI microservice.

### AI Backend (Machine Learning Microservice)
- **Framework:** Python with FastAPI
- **NLP Capabilities:** Utilizes advanced libraries for text extraction, Named Entity Recognition (NER), and embedding generation.
- **Role:** A dedicated, high-performance microservice executing the complex resume parsing, cosine similarity scoring, and LLM integrations.

---

## 📊 Implementation Status & Feature Matrix

| # | Feature Domain | Status | Key Components Implemented |
|---|----------------|:------:|----------------------------|
| **1** | **Two-Tier Shortlisting (Eligibility + AI Matching)** | ✅ Complete | Academic eligibility engine (`rulesEngine.js` for CGPA, backlogs, branch, batch) + AI Cosine Similarity score against JD (`ai/main.py` & `applicationRoutes.js`). |
| **2** | **Alumni Experience Hub & Knowledge Loop** | 🟡 85% Complete | Peer review hub, round-by-round breakdown, ratings, interview questions repository (`frontend/app/alumni-experience`, `feedbackRoutes.js`). Automated post-placed trigger prompt pending. |
| **3** | **Company Intelligence & Placement Analytics** | ✅ Complete | Live intelligence dashboard showing historical packages, conversion rates, frequently tested technical skills (`frontend/app/companies`, `companyRoutes.js`). |
| **4** | **AI Career Copilot (Conversational RAG Assistant)** | ✅ Complete | Interactive chatbot utilizing RAG over parsed PDF resumes + college placement knowledge bank + Gemini LLM fallback (`copilotRoutes.js`, `frontend/app/dashboard/copilot`). |
| **5** | **Predictive Placement Analytics (Risk Modeling)** | ✅ Complete | Admin risk engine modeling placement probability using weighted CGPA, backlogs penalty, and AI match scores across cohorts (`analyticsRoutes.js`, `frontend/app/admin/analytics`). |
| **6** | **AI Mock Interviews & Voice Skill-Gap Analysis** | ✅ Complete | Role-specific skill gap analysis with missing skill recommendations, interactive voice-enabled mock interviewer with Speech-to-Text & Text-to-Speech (`frontend/app/dashboard/mock-interview/[jobId]`). |
| **7** | **Institutional Policy & Offer Rules (IIT-Style)** | 🟡 80% Complete | One-Student-One-Job policy, dream company 1.5x package threshold, backlog restriction checks (`rulesEngine.js`). Automated cascade withdrawal of pending lower offers pending. |
| **8** | **Automated Interview Slotting & Conflict Engine** | ✅ Complete | Conflict-free slot generator with automatic timestamp shifting across concurrent company drives, Excel roster export, WhatsApp/email sharing (`interviewRoutes.js`, `frontend/app/admin/jobs/[id]`). |

---

## 📝 Concise Project Report: What Has Been Implemented

1. **Full-Stack 3-Tier Architecture**:
   - **Frontend (Next.js 14 / React / TailwindCSS / Framer Motion)**: Complete dual dashboards for Students and Admins, modern responsive UI, interactive charts, and live search/filtering.
   - **Backend (Node.js / Express / Mongoose)**: JWT authentication, modular REST APIs for jobs, applications, batches, branches, feedbacks, analytics, and interview slots.
   - **AI Microservice (FastAPI / PyMuPDF / ONNX / LangChain)**: Real-time PDF resume text extraction, semantic similarity embeddings with TF-IDF fallback, and automated skill-gap identification.
2. **Cleaned & Curated Database**:
   - Streamlined company profiles to the primary verified campus recruiters (Google, FitTech, BMW, Fidelity Investments) and purged orphan dummy records.
   - Seeded cohort of 300 realistic student records spanning 2 batches (2026, 2027) and 3 branches (ISE, CSE, ECE) with natural Gaussian CGPA and backlog distributions.
3. **Core Workflow Integrations**:
   - Smart Job Feed dynamically ranked by individual resume match scores.
   - Roster export directly to Excel (`.xlsx`) and 1-click sharing via WhatsApp and Email for placement coordinators.
   - Voice-interactive AI mock interviews with real-time speech recognition.

---

## 🚀 What Is Left & Roadmap Plan

### Phase 1: High Priority Refinements (Current Sprint)
- [ ] **Automated Post-Placement Feedback Modal**: Display an automatic prompt when a newly placed student opens their dashboard to capture their interview experience.
- [ ] **Cascade Application Auto-Withdrawal**: Once a candidate accepts an offer, automatically mark pending applications in lower-tier companies as "Auto-Withdrawn" per the One-Student-One-Job rule.
- [ ] **Bulk Student Import (CSV/Excel)**: Allow admins to upload student master rosters in bulk via Excel directly from the admin panel.

### Phase 2: System Hardening & Polish
- [ ] **Email Notification Dispatch**: Hook Resend API credentials for automated status alerts (Interview Scheduled, Shortlisted, Offer Released).
- [ ] **Containerization (`docker-compose.yml`)**: Unify frontend, backend, AI microservice, and MongoDB into a single multi-container deployment command.

### Phase 3: Final Presentation & Defense Prep
- [ ] **Demo Video & Live Presentation Slides**: Create mock walkthrough scenarios covering both Student and Admin user flows.
- [ ] **Performance Benchmarks**: Document resume parsing speed and embedding latency metrics for the project viva report.

---
*Developed as part of the BIS785 Major Project curriculum.*

