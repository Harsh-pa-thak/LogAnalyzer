<div align="center">

# [LogAI – Intelligent Log Analysis Platform (v2.1)](https://logaiapp.netlify.app/)

**AI-powered log diagnostics with frictionless access and controlled usage**

[![Live Demo](https://img.shields.io/badge/Live-logaiapp.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://logaiapp.netlify.app/)

**Backend:** FastAPI &nbsp;|&nbsp; **Auth & DB:** Supabase &nbsp;|&nbsp; **AI:** Google Gemini &nbsp;|&nbsp; **Hosted on** Render

</div>

---

##  Overview

LogAI is a production-deployed AI-powered log analysis platform designed to help developers, DevOps engineers, and SRE teams diagnose system issues efficiently.

It converts raw log files into structured, actionable diagnostic reports using large language models, eliminating the need to manually inspect large volumes of logs.

> **Version 2.1** introduces anonymous access with controlled usage, improving onboarding while maintaining system cost protection and stability.

---

## Business Value

Modern systems generate large volumes of logs that are difficult to analyze under time constraints.

LogAI enables:

- Faster incident diagnosis
- Reduced debugging effort
- Clear root cause identification
- Actionable remediation guidance
- Controlled system usage with cost protection
- Seamless transition from anonymous to authenticated usage

The platform functions as an intelligent diagnostic layer for production environments.

---

## Core Capabilities

### AI-Powered Root Cause Analysis
- Identifies critical failures and anomalies
- Provides structured explanations
- Suggests actionable remediation steps
- Detects recurring or suspicious patterns

### Real-Time Streaming Processing
- Server-Sent Events (SSE) for live updates
- Chunk-level analysis visibility
- Progressive result delivery

### Anonymous Access with Usage Control (v2.1)
- No login required for initial usage
- Daily usage limits enforced per user/session
- Backend-controlled usage validation before AI execution
- Seamless transition to authenticated usage after limits

### Secure Authentication
- Supabase Auth integration
- Server-side ES256 JWT verification
- JWKS-based key validation
- Strict per-user data isolation

### Persistent Analysis History
- Available for authenticated users
- Timestamped reports with structured summaries
- Historical retrieval and review

### Intelligent Log Processing
- Severity classification (critical, error, warning, info)
- Context-preserving chunking
- Cost-aware AI orchestration
- Efficient token usage

---

## Architecture

```
User (Anonymous or Authenticated)
│
▼
Frontend (Netlify)
│
├── Anonymous Session (anon_id)
├── Optional Authentication (Supabase)
├── File Upload + SSE Streaming
│
▼
FastAPI Backend (Render)
│
├── Usage Guard Layer (v2.1)
│   ├── Anonymous usage tracking
│   └── Authenticated usage tracking
│
├── JWT Verification (JWKS)
├── Log Preprocessing Engine
├── Chunk Management
├── AI Orchestration (Gemini Flash)
└── Secure Storage (Supabase)
│
▼
Google Gemini Flash
```

---

## Architectural Principles

- **Additive system design** – non-destructive feature evolution
- **Zero trust** on client-side logic
- **Backend-enforced** usage and security controls
- **Stateless AI processing** with controlled state layers
- **Service-role database operations** – never exposed to client
- **Cloud-native** deployment architecture

---

## Security & Production Design

| Layer | Implementation |
|---|---|
| Token Verification | ES256 JWT with JWKS key resolution |
| Usage Enforcement | Backend-enforced daily limits |
| Database Access | Supabase service-role (never client-exposed) |
| API Protection | CORS-restricted access |
| Configuration | Environment-based secret management |

> LogAI v2.1 maintains production-grade security while enabling flexible user access.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | FastAPI · Python · LangChain · Google Gemini Flash · Supabase · Uvicorn |
| **Frontend** | Vanilla JavaScript · Marked.js · Highlight.js · Responsive CSS |
| **Infrastructure** | Netlify (Frontend) · Render (Backend) · Supabase (Auth & DB) |

---

## Supported Log Types

- **Application logs** – Python, Node.js, Java
- **System logs** – Linux, systemd, kernel
- **Web server logs** – Nginx, Apache
- **Container logs** – Docker, Kubernetes
- **Database logs**

---

## Product Roadmap

### Short-Term
- [ ] Free-tier refinement and usage optimization
- [ ] Improved UX and feedback mechanisms
- [ ] Export capabilities (PDF / structured reports)
- [ ] Enhanced error handling and observability

### Mid-Term
- [ ] Billing and subscription system
- [ ] Team and organization support
- [ ] API access for external integrations
- [ ] Usage analytics dashboard
- [ ] Background job processing

---

## Version History

| Version | Description |
|---|---|
| **v1.0** | Streaming AI Log Analyzer |
| **v2.0** | Authenticated Multi-User SaaS Architecture |
| **v2.1** | Anonymous Access with Usage Control and Improved UX *(Current)* |

---

## Author

**Harsh Pathak**
[GitHub](https://github.com/Harsh-pa-thak)

---

<div align="center">

If you find LogAI useful, consider starring the repository.

</div>