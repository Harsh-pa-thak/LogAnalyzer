
---

## Architectural Principles

- Additive system design (non-destructive feature evolution)  
- Zero trust on client-side logic  
- Backend-enforced usage and security controls  
- Stateless AI processing with controlled state layers  
- Service-role database operations (never exposed to client)  
- Cloud-native deployment architecture  

---

## Security & Production Design

- ES256 JWT verification  
- JWKS key resolution  
- Backend-enforced usage limits  
- Supabase service-role database access  
- CORS-restricted API access  
- Environment-based configuration management  

LogAI v2.1 maintains production-grade security while enabling flexible user access.

---

## Technology Stack

### Backend
- FastAPI  
- Python  
- LangChain  
- Google Gemini Flash  
- Supabase (Authentication + Database)  
- Uvicorn  

---

### Frontend
- Vanilla JavaScript  
- Marked.js  
- Highlight.js  
- Responsive CSS  

---

### Infrastructure
- Frontend: Netlify  
- Backend: Render  
- Auth & Database: Supabase  

---

## Supported Log Types

- Application logs (Python, Node.js, Java)  
- System logs (Linux, systemd, kernel)  
- Web server logs (Nginx, Apache)  
- Container logs (Docker, Kubernetes)  
- Database logs  

---

## Product Roadmap

### Short-Term
- Free-tier refinement and usage optimization  
- Improved UX and feedback mechanisms  
- Export capabilities (PDF / structured reports)  
- Enhanced error handling and observability  

---

### Mid-Term
- Billing and subscription system  
- Team and organization support  
- API access for external integrations  
- Usage analytics dashboard  
- Background job processing  

---

## Version History

- v1.0 – Streaming AI Log Analyzer  
- v2.0 – Authenticated Multi-User SaaS Architecture  
- v2.1 – Anonymous Access with Usage Control and Improved UX (Current)

---

## Author

Harsh Pathak  
GitHub: https://github.com/Harsh-pa-thak  

---

If you find LogAI useful, consider starring the repository.