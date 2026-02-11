from fastapi import FastAPI,UploadFile,File
from fastapi.responses import JSONResponse,HTMLResponse


app = FastAPI(title="Log Analyzer Agent")
@app.get("/")
def read_root():
    return {"message": "Log Analyzer Agent is running"}

