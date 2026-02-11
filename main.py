from fastapi import FastAPI

app = FastAPI(title="Log Analyzer Agent")
@app.get("/")
def read_root():
    return {"message": "Log Analyzer Agent is running"}
