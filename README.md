<div align="center">

# 🔍 LogAI - AI-Powered Log Analyzer

### Intelligent Log Analysis with Google Gemini AI

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-logaiapp.netlify.app-blue?style=for-the-badge)](https://logaiapp.netlify.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
![LogAI Dashboard](https://img.shields.io/badge/Status-Operational-success?style=flat-square)
<br>
[![Netlify Status](https://api.netlify.com/api/v1/badges/7876c2f7-237a-4b98-b8c1-c4043b22b788/deploy-status)](https://app.netlify.com/projects/logaiapp/deploys)


</div>

---

## ⚡ Overview

**LogAI** is an intelligent log analysis platform that leverages Google's Gemini AI to automatically detect, analyze, and diagnose issues in your application logs. Say goodbye to manually sifting through thousands of log lines – let AI do the heavy lifting.

### 🎯 Key Features

- **🤖 AI-Powered Analysis** - Uses Google Gemini Flash for intelligent error detection and root cause analysis
- **📊 Real-time Streaming** - Server-Sent Events (SSE) for live analysis progress tracking
- **🧩 Smart Chunking** - Automatically processes large log files by splitting them into manageable chunks
- **🎨 Modern UI** - Beautiful, responsive dashboard with drag-and-drop file upload
- **🔍 Pattern Recognition** - Detects errors, warnings, critical issues, and suspicious patterns
- **📈 Statistical Insights** - Real-time metrics showing critical issues, errors, and warnings
- **🚀 Fast & Efficient** - Compresses repetitive log entries for optimal processing

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  HTML/CSS/JS (Netlify)
│   (Netlify)     │  • Drag & drop upload
└────────┬────────┘  • Real-time progress
         │           • Markdown rendering
         │ SSE
         ▼
┌─────────────────┐
│   FastAPI       │  Python Backend (Render)
│   Backend       │  • Log preprocessing
└────────┬────────┘  • Chunk management
         │           • AI orchestration
         │
         ▼
┌─────────────────┐
│  Google Gemini  │  AI Analysis
│    Flash API    │  • Error detection
└─────────────────┘  • Root cause analysis
                     • Actionable insights
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Google Gemini API Key ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harsh-pa-thak/LogAnalyzer.git
   cd LogAnalyzer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file
   echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Access the dashboard**
   ```
   Open http://localhost:8000 in your browser
   ```

---

## 📦 Project Structure

```
LogAnalyzer/
├── main.py                 # FastAPI application & API endpoints
├── log_processor.py        # Log preprocessing & chunking logic
├── index.html              # Frontend UI
├── index.js                # Frontend JavaScript logic
├── style.css               # Styling & animations
├── requirements.txt        # Python dependencies
├── render.yaml             # Render deployment config
├── dummy_log.txt           # Sample log file for testing
└── .env                    # Environment variables (create this)
```

---

## 🔧 How It Works

### 1. **Log Preprocessing**
The system categorizes log lines by severity:
- **Critical** - System failures, kernel bugs, data corruption
- **Error** - Failures, exceptions, crashes, OOM errors
- **Warning** - Timeouts, deprecations, slow responses
- **Info** - General informational logs

### 2. **Smart Chunking**
Large log files are split into ~60KB chunks with 500-character overlap to maintain context. The system automatically caps at 8 chunks to optimize API costs.

### 3. **AI Analysis Pipeline**
Each chunk is analyzed by Gemini AI acting as a "Senior Site Reliability Engineer":
- Identifies main errors and failures
- Explains root causes in simple terms
- Suggests practical next steps
- Detects suspicious patterns

### 4. **Synthesis**
All chunk analyses are synthesized into a final report with:
- **What Went Wrong** - Specific problems with error codes & timestamps
- **What To Do Next** - Actionable remediation steps
- **Final Verdict** - Overall system health assessment

---

## 🎨 Features in Detail

### Drag & Drop Upload
Simply drag your `.txt` log file onto the dashboard or click to browse.

### Real-Time Progress Tracking
Watch your log analysis progress through three stages:
1. **Preprocess** - Categorization and compression
2. **Analyze** - AI examination of each chunk
3. **Synthesize** - Final report generation

### Statistical Dashboard
Live metrics showing:
- Total lines processed
- Critical issues detected
- Error count
- Warning count

### Markdown-Rendered Reports
Analysis results are beautifully formatted with:
- Syntax highlighting
- Code blocks
- Structured sections
- Copy-to-clipboard functionality

---

## 🌐 API Endpoints

### `GET /`
Returns the main HTML dashboard

### `POST /analyze`
Single-shot log analysis (legacy endpoint)
- **Input**: `.txt` file upload
- **Output**: Complete analysis JSON

### `POST /analyze-stream`
Streaming log analysis with SSE
- **Input**: `.txt` file upload
- **Output**: Real-time progress events + final analysis

### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "google_api_key_configured": true
}
```

---

## 🔌 Technologies Used

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[LangChain](https://python.langchain.com/)** - LLM orchestration
- **[Google Gemini](https://ai.google.dev/)** - AI analysis engine
- **[Uvicorn](https://www.uvicorn.org/)** - ASGI server

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **[Marked.js](https://marked.js.org/)** - Markdown rendering
- **[Highlight.js](https://highlightjs.org/)** - Syntax highlighting
- **Custom CSS** - Modern glassmorphism design

### Deployment
- **Frontend**: [Netlify](https://www.netlify.com/)
- **Backend**: [Render](https://render.com/)

---

## 📊 Log Format Support

LogAI supports all common log formats:
- **Application Logs** - Python, Node.js, Java, etc.
- **System Logs** - Linux kernel, systemd, dmesg
- **Container Logs** - Docker, Kubernetes
- **Web Server Logs** - Apache, Nginx
- **Database Logs** - PostgreSQL, MySQL, MongoDB

---

## 🎯 Use Cases

- **DevOps & SRE** - Quickly diagnose production incidents
- **Developers** - Understand application failures
- **System Administrators** - Monitor system health
- **QA Engineers** - Analyze test failures
- **Security Teams** - Investigate suspicious patterns

---

## 🚧 Roadmap

- [ ] Multi-file upload support
- [ ] Historical analysis tracking
- [ ] PDF report export
- [ ] Custom severity rules
- [ ] Integration with logging platforms (Datadog, Splunk)
- [ ] Slack/Discord notifications
- [ ] Advanced filtering & search

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Harsh Pathak

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Google Gemini** for providing the AI analysis engine
- **FastAPI** for the excellent web framework
- **LangChain** for LLM orchestration tools
- **Netlify & Render** for hosting infrastructure

---

## 📧 Contact

**Harsh Pathak**
- GitHub: [@Harsh-pa-thak](https://github.com/Harsh-pa-thak)
- Live Demo: [logaiapp.netlify.app](https://logaiapp.netlify.app/)

---

<div align="center">

### ⭐ Star this repo if you find it useful!

Made by [Harsh Pathak](https://github.com/Harsh-pa-thak)

</div>
