"""Promptly backend entrypoint.

Run with ``cd backend && uvicorn main:app --reload`` (or from the repo
root with ``uvicorn backend.main:app --reload`` — the paths below make
the flat module imports work from either location).

Each feature lives in its own module that exports an ``APIRouter``.
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
for _p in (BACKEND_DIR, BACKEND_DIR.parent):  # flat imports + root `pdf` module
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import helper
from bootcamp import router as bootcamp_router
from checkpoint import router as checkpoint_router
from lecture import router as lecture_router
from placement import router as placement_router
from progress import router as progress_router

app = FastAPI(
    title="Promptly",
    description=(
        "Upload your study material, get a prerequisite map, diagnose your "
        "skill level, train through a bootcamp, prove mastery, and compete."
    ),
    version="0.1.0",
)

# TODO: tighten origins before deploying for real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lecture_router)
app.include_router(placement_router)
app.include_router(bootcamp_router)
app.include_router(checkpoint_router)
app.include_router(progress_router)


@app.exception_handler(helper.LLMError)
def llm_error(request: Request, exc: helper.LLMError) -> JSONResponse:
    """The LLM proxy failed or answered with unusable output: a bad gateway, not our bug."""
    return JSONResponse(status_code=502, content={"detail": str(exc)})

_STATIC_DIR = Path(__file__).parent / "static"


@app.get("/", include_in_schema=False)
def landing() -> FileResponse:
    """Serve the landing page."""
    return FileResponse(_STATIC_DIR / "landing.html")


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")