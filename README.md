<div align="center">

# 🔍 LogAI – Intelligent Log Analysis Platform (v2.0)

### Secure, Real-Time, AI-Powered Log Diagnostics for Modern Systems

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-logaiapp.netlify.app-blue?style=for-the-badge)](https://logaiapp.netlify.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
![Status](https://img.shields.io/badge/Status-Live-success?style=flat-square)

</div>

---

# 🚀 Overview

**LogAI** is a production-deployed AI-powered log analysis platform designed to help developers, DevOps engineers, and SRE teams diagnose system failures faster and more intelligently.

It eliminates the need to manually inspect thousands of log lines by transforming raw logs into structured, actionable diagnostic reports using advanced AI.

LogAI v2.0 introduces secure authentication, persistent analysis history, and a scalable SaaS-ready architecture.

---

# 💼 Business Value

Modern systems generate massive volumes of logs. Identifying the root cause of issues manually is time-consuming and error-prone.

LogAI enables:

- ⚡ Faster incident diagnosis
- 📉 Reduced debugging time
- 📊 Clear root cause explanations
- 🧠 AI-assisted decision support
- 🔐 Secure multi-user access
- 🗂️ Persistent historical analysis

This positions LogAI as an intelligent diagnostics layer for modern software systems.

---

# ✨ Core Capabilities

## 🤖 AI-Powered Root Cause Analysis
- Identifies primary failures
- Explains issues in plain language
- Suggests concrete remediation steps
- Detects suspicious patterns

## 📡 Real-Time Streaming Analysis
- Live processing using Server-Sent Events (SSE)
- Chunk-by-chunk progress visibility
- Immediate diagnostic feedback

## 🔐 Secure Authentication (v2.0)
- Supabase Auth integration
- Server-side ES256 JWT verification
- JWKS-based signature validation
- Strict user isolation

## 🗂️ Persistent Analysis History
- Per-user stored reports
- Timestamped log summaries
- Structured severity metrics
- Historical reference access

## 📊 Intelligent Log Processing
- Automatic severity classification
- Smart chunking with context overlap
- Token-efficient AI orchestration
- Cost-controlled processing limits

---

# 🏗️ System Architecture

```text
Frontend (Netlify)
│
│  Supabase Auth (Client)
│  Secure Upload
│  SSE Streaming
▼
FastAPI Backend (Render)
│
├── JWT Verification (JWKS)
├── Log Preprocessing Engine
├── Chunk Management
├── AI Orchestration (Gemini Flash)
└── Secure History Storage (Supabase)
        │
        ▼
Google Gemini Flash
```

### Architectural Principles

- Zero trust on client
- Stateless AI processing with stateful user management
- Secure service-role database writes
- Graceful AI failure handling
- Production deployment with environment isolation

---

# 🔐 Security & Production Readiness

- Server-side token validation (ES256)
- JWKS key resolution
- Secure service-role Supabase client
- CORS-restricted origins
- Environment-based secret management
- Cloud-hosted backend infrastructure

LogAI v2.0 is built with SaaS-grade security fundamentals.

---

# 📈 Technology Stack

### Backend
- **FastAPI**
- **Python**
- **LangChain**
- **Google Gemini Flash**
- **Supabase (Auth + Database)**
- **Uvicorn**

### Frontend
- Vanilla JavaScript
- Marked.js (Markdown rendering)
- Highlight.js (Syntax highlighting)
- Modern responsive CSS

### Infrastructure
- **Frontend Hosting:** Netlify
- **Backend Hosting:** Render
- **Auth & DB:** Supabase

---

# 🌐 Live Deployment

🔗 https://logaiapp.netlify.app/

Backend deployed on Render with environment-secured configuration.

---

# 📊 Supported Log Types

- Application logs (Python, Node, Java, etc.)
- System logs (Linux, kernel, systemd)
- Web server logs (Nginx, Apache)
- Container logs (Docker, Kubernetes)
- Database logs

---

# 🚧 Product Roadmap

### Near-Term
- Usage-based free tier
- Analysis quotas
- Improved telemetry & monitoring
- PDF export

### Mid-Term
- Team accounts
- API access
- Usage analytics dashboard
- Billing integration
- Background job processing

---

# 🧩 Version History

- **v1.0** – Streaming AI Log Analyzer  
- **v2.0** – Authenticated Multi-User SaaS Architecture (Current)

---

# 👨‍💻 Author

**Harsh Pathak**  
GitHub: https://github.com/Harsh-pa-thak  

---

# ⭐ Support

If you find LogAI valuable, consider starring the repository and following its evolution.
