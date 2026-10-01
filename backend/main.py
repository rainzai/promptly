"""Promptly backend entrypoint.

Run with ``cd backend && uvicorn main:app --reload`` (or from the repo
root with ``uvicorn backend.main:app --reload`` — the paths below make
the flat module imports work from either location).

Each feature lives in its own module that exports an ``APIRouter``. When the
frontend has been built (``npm run build``), this server also serves it, so
one process runs the whole app (see the Dockerfile).
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"
for _p in (BACKEND_DIR, BACKEND_DIR.parent):  # flat imports + root `pdf` module
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse

import demo
import helper
import limits
from bootcamp import router as bootcamp_router
from challenges import router as challenges_router
from checkpoint import router as checkpoint_router
from config import DEMO
from expertise import router as expertise_router
from lecture import router as lecture_router
from peer_review import router as peer_review_router
from placement import router as placement_router
from progress import router as progress_router

app = FastAPI(
    title="Promptly",
    description=(
        "Upload your lecture slides, test yourself on what the lecture builds on, "
        "practise prompting with reverse-prompt challenges, build your prompt "
        "expertise, and help other students as a Peer Reviewer."
    ),
    version="0.1.0",
)

app.include_router(lecture_router)
app.include_router(placement_router)
app.include_router(bootcamp_router)
app.include_router(checkpoint_router)
app.include_router(progress_router)
app.include_router(challenges_router)
app.include_router(expertise_router)
app.include_router(peer_review_router)

if DEMO:
    demo.seed()


@app.middleware("http")
async def remember_visitor(request: Request, call_next):
    """Charge the AI calls this request makes to the visitor's IP address (see limits.py)."""
    token = limits.visitor.set(request.client.host if request.client else "unknown")
    try:
        return await call_next(request)
    finally:
        limits.visitor.reset(token)


@app.exception_handler(limits.TooManyCalls)
def too_many_calls(request: Request, exc: limits.TooManyCalls) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": str(exc)})


@app.exception_handler(helper.LLMBusy)
def llm_busy(request: Request, exc: helper.LLMBusy) -> JSONResponse:
    """The AI provider's rate limit or capacity, not a bug: tell the student to wait."""
    return JSONResponse(
        status_code=503,
        content={"detail": "The AI is busy right now. Wait a minute and try again."},
    )


@app.exception_handler(helper.LLMError)
def llm_error(request: Request, exc: helper.LLMError) -> JSONResponse:
    """The LLM API failed or answered with unusable output: a bad gateway, not our bug."""
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


if FRONTEND_DIST.is_dir():

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        """The built frontend. Every page is index.html: the app picks the page from the URL."""
        if path.startswith("api/"):
            raise HTTPException(404, "Not Found")
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and file.is_relative_to(FRONTEND_DIST):
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")