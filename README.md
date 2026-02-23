<div align="center">

# [LogAI – Intelligent Log Analysis Platform (v2.0)](https://logaiapp.netlify.app/)

Secure, real-time AI-powered diagnostics for modern systems

[Live](https://logaiapp.netlify.app/)  
Backend: FastAPI | Auth & DB: Supabase | AI: Google Gemini | Hosted on Render

</div>

---

## Overview

LogAI is a production-deployed AI-powered log analysis platform built to help developers, DevOps engineers, and SRE teams diagnose system failures efficiently.

It transforms raw log files into structured, actionable diagnostic reports using large language models, eliminating the need to manually inspect thousands of log lines.

Version 2.0 introduces secure authentication, persistent per-user history, and a SaaS-ready backend architecture.

---

## Business Value

Modern distributed systems generate high-volume logs that are difficult to interpret under time pressure.

LogAI enables:

- Faster incident diagnosis  
- Reduced debugging time  
- Clear root cause explanations  
- Actionable remediation guidance  
- Secure multi-user access  
- Persistent historical analysis  

The platform functions as an intelligent diagnostic layer for production systems.

---

## Core Capabilities

### AI-Powered Root Cause Analysis
- Identifies primary failures and anomalies  
- Explains issues in plain, structured language  
- Suggests concrete next steps  
- Detects repeated or suspicious patterns  

### Real-Time Streaming Processing
- Server-Sent Events (SSE) based progress updates  
- Chunk-by-chunk analysis visibility  
- Immediate feedback during processing  

### Secure Authentication (v2.0)
- Supabase Auth integration  
- Server-side ES256 JWT verification  
- JWKS-based signature validation  
- Strict per-user data isolation  

### Persistent Analysis History
- Stored reports per authenticated user  
- Timestamped log summaries  
- Structured severity metrics  
- Historical report retrieval  

### Intelligent Log Processing
- Automatic severity categorization  
- Context-preserving chunking  
- Cost-aware AI orchestration  
- Token-efficient processing  

---

## Architecture

```
Frontend (Netlify)
│
│  Supabase Authentication
│  Secure File Upload
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

- Zero trust on client-side logic  
- Stateless AI processing with stateful user management  
- Service-role database writes (never exposed to client)  
- Graceful AI failure handling  
- Environment-based secret management  
- Cloud-hosted production infrastructure  

---

## Security & Production Design

- ES256 JWT verification  
- JWKS key resolution  
- Supabase service-role usage for controlled DB access  
- CORS-restricted origins  
- Environment-based configuration  
- Deployed backend on Render  

LogAI v2.0 is structured with SaaS-grade security fundamentals.

---

## Technology Stack

### Backend
- FastAPI  
- Python  
- LangChain  
- Google Gemini Flash  
- Supabase (Authentication + Database)  
- Uvicorn  

### Frontend
- Vanilla JavaScript  
- Marked.js  
- Highlight.js  
- Responsive CSS  

### Infrastructure
- Frontend: Netlify  
- Backend: Render  
- Auth & Database: Supabase  

---

## Supported Log Types

- Application logs (Python, Node.js, Java, etc.)  
- System logs (Linux, kernel, systemd)  
- Web server logs (Nginx, Apache)  
- Container logs (Docker, Kubernetes)  
- Database logs  

---

## Product Roadmap

Short-Term
- Usage limits and free tier model  
- Analysis quotas  
- Improved telemetry  
- PDF export  

Mid-Term
- Team accounts  
- API access  
- Usage analytics dashboard  
- Billing integration  
- Background job processing  

---

## Version History

v1.0 – Streaming AI Log Analyzer  
v2.0 – Authenticated Multi-User SaaS Architecture (Current)

---

## Author

Harsh Pathak  
GitHub: https://github.com/Harsh-pa-thak  

---

If you find LogAI useful, consider starring the repository.
