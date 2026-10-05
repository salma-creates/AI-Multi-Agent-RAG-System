# LUMINA AI — Multi-Agent RAG Knowledge Retrieval System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini_3.8-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)

**Lumina AI** is a production-grade, multi-agent Retrieval-Augmented Generation (RAG) knowledge retrieval platform. Users can upload custom documents (PDF, DOCX, TXT, CSV), query their knowledge base, receive strictly grounded answers with source citations, resolve multi-turn follow-ups, interact via two-way voice (Web Speech API), and monitor system performance and knowledge gaps through an analytics dashboard.

---

## 🌟 Key System Features & Feature Mapping

### Milestone 1 — Foundation & Knowledge Retrieval
- **Multi-Format Ingestion**: Supports PDF, DOCX, TXT, and CSV file upload and text extraction.
- **Smart Chunking & Metadata**: Text units are split into overlapping character chunks preserving section/page labels, chunk position, and document ID.
- **Dense Vector Embeddings**: Real 3072-dimensional vector embeddings generated using Google Gemini API (`gemini-embedding-001`).
- **Vector Search Engine**: In-memory cosine similarity search backed by SQLite persistence with Top-1, Top-3, Top-5 ranking and relevance threshold filtering.

### Milestone 2 — Multi-Agent Query Resolution
- **5-Agent Architecture**:
  1. **Query Understanding Agent**: Classifies queries into `factual`, `procedural`, `comparative`, `ambiguous`, or `general` intent.
  2. **Retrieval Agent**: Performs Top-K vector retrieval with similarity ranking.
  3. **Response Generation Agent**: Uses Gemini (`gemini-3.8-flash`) with strict anti-hallucination prompts, source citations, and confidence scoring.
  4. **Clarification Agent**: Detects vague queries and formulates targeted clarification prompts.
  5. **Conversation Memory Agent**: Maintains multi-turn context and resolves pronoun references (e.g. "What is it?").
- **Multi-Agent Orchestrator**: Automated pipeline connecting memory $\rightarrow$ intent classification $\rightarrow$ retrieval $\rightarrow$ grounded generation.

### Milestone 3 — Clarification, Memory, Voice & Transparency
- **Web Speech STT**: Hands-free Speech-to-Text microphone recording.
- **Web Speech TTS**: Text-to-Speech audio playback controls (Play, Pause, Resume, Stop) for generated answers.
- **Response Transparency Panel**: Expandable accordion detailing document names, page/section, chunk IDs, relevance scores, and text snippets.

### Milestone 4 — Analytics, Testing & Optimization
- **Analytics Dashboard**: Tracks query counts, intent distribution, average confidence, latency, and knowledge gap detection for unanswered queries.
- **RAG Hyperparameter Tuning**: Live sliders for Top-K, similarity threshold, chunk size, and chunk overlap.
- **Multi-Domain Testing**: Tested across 3 distinct domains (Lumina RAG benchmark, Cloud Infrastructure & DevOps, Clinical Neuroscience).

---

## 🏗 System Architecture

```
User Query (Text / Voice STT)
         │
         ▼
[ FastAPI API Layer ]
         │
         ▼
[ Multi-Agent Orchestrator ]
  ├── 1. Memory Agent (Entity / Pronoun Resolution)
  ├── 2. Query Understanding Agent (Intent Classification)
  ├── 3. [If Ambiguous] ──► Clarification Agent ──► User Prompt
  ├── 4. [If General]   ──► Response Generation (General AI)
  └── 5. [If Grounded]  ──► Retrieval Agent (Gemini Embeddings + Cosine Search)
                                 │
                                 ▼
                         Response Generation Agent (Strict Evidence Grounding)
                                 │
                                 ▼
[ Output: Grounded Answer + Citations + Confidence + Web Speech TTS ]
```

---

## 🛠 Technology Stack

- **Frontend**: React 18, Vite 5, JavaScript (JSX), Custom Dark Design System, Lucide Icons, Web Speech API (STT/TTS).
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2, Python-Dotenv.
- **AI & LLM**: Google GenAI SDK (`google-genai`), `gemini-3.8-flash` (LLM Reasoning), `gemini-embedding-001` (Dense Embeddings).
- **Document Processing**: `pypdf`, `pdfplumber`, `python-docx`.
- **Database**: SQLite3 for documents, chunks, vectors, query logs, responses, and conversation memory.

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm
- A valid Google Gemini API Key (`GEMINI_API_KEY`)

---

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and insert your GEMINI_API_KEY
# GEMINI_API_KEY=your_actual_key_here

# Run backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend will start on **http://127.0.0.1:8000** (Swagger documentation at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup (React + Vite)

In a second terminal:

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Frontend will start on **http://localhost:5173**.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root status and API sitemap |
| `GET` | `/api/health` | System health, Gemini key check, indexed chunk count |
| `POST` | `/api/upload` | Ingests PDF, DOCX, TXT, or CSV document |
| `POST` | `/api/query` | Executes 5-agent RAG retrieval pipeline |
| `GET` | `/api/documents` | Lists all ingested documents and statuses |
| `DELETE` | `/api/documents/{id}` | Removes document and deletes its vector chunks |
| `GET` | `/api/analytics` | Returns query metrics, intent distribution, knowledge gaps |
| `GET` | `/api/conversations` | Lists active conversation sessions |
| `GET` | `/api/conversations/{id}` | Retrieves multi-turn conversation turn history |
| `POST` | `/api/conversations` | Creates a new conversation session |
| `GET` | `/api/settings` | Returns current RAG hyperparameters |
| `POST` | `/api/settings` | Updates Top-K, threshold, chunk size, and overlap |
| `POST` | `/api/test/preload-benchmark` | Preloads Lumina RAG test document for verification |

---

## 🧪 Testing & Verification

Automated test suites verify end-to-end functionality across 3 knowledge domains:

```bash
cd backend
python tests/test_milestone1.py
python tests/test_milestone2.py
```

---

## 📄 License
This project is licensed under the MIT License.
