from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
import json
import asyncio
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from log_processor import preprocess_log, split_into_chunks, CHUNK_PROMPT, SYNTHESIS_PROMPT

load_dotenv()

prompt_template = """
You are a senior site reliability engineer.

Analyze the following application logs.

1. Identify the main errors or failures.
2. Explain the likely root cause in simple terms.
3. Suggest practical neengineerxt steps to fix or investigate.
4. Mention any suspicious patterns or repeated issues.

Logs:
{log_data}

Respond in clear paragraphs. Avoid jargon where possible.
"""
llm = ChatGoogleGenerativeAI(
    temperature=0.2,
    model="gemini-flash-latest"
)


def _extract_text(result) -> str:
    """Extract text from LLM response (handles list and string formats)."""
    content = result.content
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                text_parts.append(part["text"])
            elif isinstance(part, str):
                text_parts.append(part)
        return "".join(text_parts)
    return str(content)


async def aLog(log_data: str):
    fpt = prompt_template.format(log_data=log_data)
    result = await llm.ainvoke(fpt)
    return _extract_text(result)


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


async def _stream_analysis(log_text: str):
    """SSE generator: preprocess → chunk → analyze → synthesize."""
    # Stage 1: Preprocessing
    yield _sse_event({"stage": "preprocessing", "message": "Preprocessing log file..."})
    processed = preprocess_log(log_text)
    yield _sse_event({
        "stage": "preprocessed",
        "stats": processed.summary_stats,
        "message": f"Preprocessed {processed.original_line_count} lines",
    })

    # Stage 2: Chunking
    chunks = split_into_chunks(processed.processed_text)
    total_chunks = len(chunks)
    yield _sse_event({
        "stage": "chunking",
        "total_chunks": total_chunks,
        "message": f"Split into {total_chunks} chunks for analysis",
    })

    # Stage 3: Analyze each chunk
    chunk_results = []
    for i, chunk in enumerate(chunks, 1):
        yield _sse_event({
            "stage": "analyzing",
            "chunk_index": i,
            "total_chunks": total_chunks,
            "message": f"Analyzing chunk {i}/{total_chunks}...",
        })
        prompt = CHUNK_PROMPT.format(
            chunk_index=i, total_chunks=total_chunks, chunk_text=chunk,
        )
        try:
            result = await llm.ainvoke(prompt)
            analysis = _extract_text(result)
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                yield _sse_event({"stage": "error", "message": "Rate limit hit. Please wait a minute and try again."})
            else:
                yield _sse_event({"stage": "error", "message": f"AI analysis failed: {error_msg[:200]}"})
            return
        chunk_results.append(analysis)
        yield _sse_event({
            "stage": "chunk_done",
            "chunk_index": i,
            "total_chunks": total_chunks,
            "result": analysis,
        })

    # Stage 4: Synthesize all chunk analyses
    yield _sse_event({"stage": "synthesizing", "message": "Synthesizing final report..."})
    combined = "\n\n---\n\n".join(
        [f"### Chunk {i+1} Analysis\n{r}" for i, r in enumerate(chunk_results)]
    )
    stats_str = json.dumps(processed.summary_stats, indent=2)
    synth_prompt = SYNTHESIS_PROMPT.format(
        total_lines=processed.original_line_count,
        total_chunks=total_chunks,
        chunk_analyses=combined,
        stats=stats_str,
    )
    try:
        synth_result = await llm.ainvoke(synth_prompt)
        final_report = _extract_text(synth_result)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            yield _sse_event({"stage": "error", "message": "Rate limit hit. Please wait a minute and try again."})
        else:
            yield _sse_event({"stage": "error", "message": f"AI analysis failed: {error_msg[:200]}"})
        return

    yield _sse_event({
        "stage": "complete",
        "result": final_report,
        "stats": processed.summary_stats,
    })

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


@app.post("/analyze-stream")
async def analyze_log_stream(file: UploadFile = File(...)):
    """SSE endpoint for chunked analysis of large log files."""
    if not file.filename.endswith(".txt"):
        return JSONResponse({"error": "Please upload a .txt file"}, status_code=400)
    try:
        content = await file.read()
        log_text = content.decode("utf-8", errors="ignore")
        if not log_text.strip():
            return JSONResponse({"error": "Empty file"}, status_code=400)
        return StreamingResponse(
            _stream_analysis(log_text),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    
@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {
        "status": "healthy",
        "google_api_key_configured": bool(os.getenv("GOOGLE_API_KEY"))
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
        "https://logaiapp.netlify.app",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

