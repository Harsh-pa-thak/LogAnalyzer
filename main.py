from fastapi import FastAPI,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse,HTMLResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

prompt_template = """
You are a senior site reliability engineer.

Analyze the following application logs.

1. Identify the main errors or failures.
2. Explain the likely root cause in simple terms.
3. Suggest practical next steps to fix or investigate.
4. Mention any suspicious patterns or repeated issues.

Logs:
{log_data}

Respond in clear paragraphs. Avoid jargon where possible.
"""
llm = ChatGoogleGenerativeAI(
    temperature=0.2,
    model="gemini-flash-latest"
)
def splitLog(log_data:str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )
    return splitter.split_text(log_data)

async def aLog(log_data:str):
    c = splitLog(log_data)
    combined=[]
    for chunk in c:
        fpt=prompt_template.format(log_data=chunk)
        result = await llm.ainvoke(fpt)
        
        content = result.content
        if isinstance(content, list):
            # Extract text from list of content parts
            text_parts = []
            for part in content:
                if isinstance(part, dict) and "text" in part:
                     text_parts.append(part["text"])
                elif isinstance(part, str):
                    text_parts.append(part)
            combined.append("".join(text_parts))
        else:
            combined.append(str(content))
    return "\n\n".join(combined)
    
app = FastAPI(title="Log Analyzer Agent")

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html", "r") as f:
        return f.read()


@app.post("/analyze")
async def analyze_log(file: UploadFile = File(...)):
   if not file.filename.endswith(".txt"):
    return JSONResponse({"error": "Please upload a .txt file"}, status_code=400)
   try:
    content= await file.read()
    logT = content.decode("utf-8",errors="ignore")
    if not logT.strip():
        return JSONResponse({"error": "Empty file"}, status_code=400)
    info = await aLog(logT)

    return {"analysis":info}
   except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)
    
@app.get("/health")
async def health_check():
    api_key_set = bool(os.getenv("GOOGLE_API_KEY"))
    return {
        "status": "healthy",
        "google_api_key_configured": api_key_set
    }

# Serve static files explicitly to avoid route conflicts
@app.get("/style.css")
async def get_css():
    return FileResponse("style.css", media_type="text/css")

@app.get("/index.js")
async def get_js():
    return FileResponse("index.js", media_type="application/javascript")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://serverloganalyzer.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

