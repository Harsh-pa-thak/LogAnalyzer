from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, StreamingResponse
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
import os
import json
import requests
from jose import jwt, jwk
from jose.utils import base64url_decode
from langchain_google_genai import ChatGoogleGenerativeAI
from log_processor import preprocess_log, split_into_chunks, CHUNK_PROMPT, SYNTHESIS_PROMPT


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL not configured")

SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1"

security = HTTPBearer()

try:
    JWKS = requests.get(SUPABASE_JWKS_URL).json()
except Exception:
    JWKS = {"keys": []}


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




def get_current_user(credentials=Depends(security)):
    print("AUTH DEPENDENCY CALLED")

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        print("RAW TOKEN:", token[:40])
        print("KID:", kid)

        # Fetch fresh JWKS every request (safe for now)
        jwks = requests.get(SUPABASE_JWKS_URL).json()

        key = next(
            (k for k in jwks["keys"] if k["kid"] == kid),
            None
        )

        if key is None:
            raise HTTPException(status_code=401, detail="Invalid token key")

        # 🔥 Construct public key properly
        public_key = jwk.construct(key)

        # Convert to PEM
        pem_key = public_key.to_pem().decode("utf-8")

        payload = jwt.decode(
            token,
            pem_key,
            algorithms=["ES256"],
            issuer=SUPABASE_ISSUER,
            options={"verify_aud": False},
        )

        print("Authenticated user:", payload.get("sub"))
        return payload

    except Exception as e:
        print("JWT ERROR:", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")



def _extract_text(result) -> str:
    content = result.content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
            elif isinstance(part, str):
                parts.append(part)
        return "".join(parts)
    return str(content)


async def analyze_simple(log_data: str):
    prompt = prompt_template.format(log_data=log_data)
    result = await llm.ainvoke(prompt)
    return _extract_text(result)


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _stream_analysis(log_text: str):
    yield _sse_event({"stage": "preprocessing", "message": "Preprocessing log file..."})
    processed = preprocess_log(log_text)

    yield _sse_event({
        "stage": "preprocessed",
        "stats": processed.summary_stats,
        "message": f"Preprocessed {processed.original_line_count} lines",
    })

    chunks = split_into_chunks(processed.processed_text)
    total_chunks = len(chunks)

    yield _sse_event({
        "stage": "chunking",
        "total_chunks": total_chunks,
        "message": f"Split into {total_chunks} chunks",
    })

    chunk_results = []

    for i, chunk in enumerate(chunks, 1):
        yield _sse_event({
            "stage": "analyzing",
            "chunk_index": i,
            "total_chunks": total_chunks,
        })

        prompt = CHUNK_PROMPT.format(
            chunk_index=i,
            total_chunks=total_chunks,
            chunk_text=chunk,
        )

        try:
            result = await llm.ainvoke(prompt)
            analysis = _extract_text(result)
            chunk_results.append(analysis)

            yield _sse_event({
                "stage": "chunk_done",
                "chunk_index": i,
                "total_chunks": total_chunks,
                "result": analysis,
            })

        except Exception:
            yield _sse_event({
                "stage": "error",
                "message": "AI processing failed",
            })
            return

    yield _sse_event({"stage": "synthesizing"})

    combined = "\n\n---\n\n".join(
        [f"### Chunk {i+1}\n{r}" for i, r in enumerate(chunk_results)]
    )

    synth_prompt = SYNTHESIS_PROMPT.format(
        total_lines=processed.original_line_count,
        total_chunks=total_chunks,
        chunk_analyses=combined,
        stats=json.dumps(processed.summary_stats, indent=2),
    )

    try:
        final_result = await llm.ainvoke(synth_prompt)
        final_report = _extract_text(final_result)

        yield _sse_event({
            "stage": "complete",
            "result": final_report,
            "stats": processed.summary_stats,
        })

    except Exception:
        yield _sse_event({
            "stage": "error",
            "message": "Final synthesis failed",
        })



app = FastAPI(title="Log Analyzer Agent")

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html", "r") as f:
        return f.read()

@app.post("/analyze")
async def analyze_log(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    if not file.filename.endswith(".txt"):
        return JSONResponse({"error": "Please upload a .txt file"}, status_code=400)

    content = await file.read()
    log_text = content.decode("utf-8", errors="ignore")

    if not log_text.strip():
        return JSONResponse({"error": "Empty file"}, status_code=400)

    result = await analyze_simple(log_text)
    return {"analysis": result}

@app.post("/analyze-stream")
async def analyze_stream(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    if not file.filename.endswith(".txt"):
        return JSONResponse({"error": "Please upload a .txt file"}, status_code=400)

    content = await file.read()
    log_text = content.decode("utf-8", errors="ignore")

    if not log_text.strip():
        return JSONResponse({"error": "Empty file"}, status_code=400)

    return StreamingResponse(
        _stream_analysis(log_text),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/style.css")
async def get_css():
    return FileResponse("style.css", media_type="text/css")

@app.get("/index.js")
async def get_js():
    return FileResponse("index.js", media_type="application/javascript")

@app.get("/health")
async def health():
    return {"status": "healthy"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://logaiapp.netlify.app",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)