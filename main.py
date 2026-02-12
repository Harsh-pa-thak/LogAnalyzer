from fastapi import FastAPI,UploadFile,File
from fastapi.responses import JSONResponse,HTMLResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI

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
llm = ChatOpenAI(
    temperature=0.2,
    model="gpt-4o-mini"
)
def splitLog(log_data:str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )
    return splitter.split_text(log_data)

def aLog(log_data:str):
    c = splitLog(log_data)
    combined=[]
    for chunk in c:
        fpt=prompt_template.format(log_data=chunk)
        result = llm.invoke(fpt)
        combined.append(result.content)
    return "\n\n".join(combined)
    
app = FastAPI(title="Log Analyzer Agent")
app.mount("/", StaticFiles(directory=".", html=True), name="static")

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
    info = analyze_log(logT)
    return {"analysis":info}
   except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)
    
    