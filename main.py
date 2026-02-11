from fastapi import FastAPI,UploadFile,File
from fastapi.responses import JSONResponse,HTMLResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
# log_analysis_prompt_text = """
# You are a senior site reliability engineer.

# Analyze the following application logs.

# 1. Identify the main errors or failures.
# 2. Explain the likely root cause in simple terms.
# 3. Suggest practical next steps to fix or investigate.
# 4. Mention any suspicious patterns or repeated issues.

# Logs:
# {log_data}

# Respond in clear paragraphs. Avoid jargon where possible.
# """
# llm = ChatOpenAI(
#     temperature=0.2,
#     model="gpt-4o-mini"
# )

app = FastAPI(title="Log Analyzer Agent")
app.mount("/", StaticFiles(directory=".", html=True), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html", "r") as f:
        return f.read()


