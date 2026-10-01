"""Upload -> Map -> Diagnose.

- ``GET  /api/topics``           the example topics from the brief
- ``POST /api/upload``           slides/PDF/notes (multipart)
- ``POST /api/map``              prerequisite map from topic + material text
- ``POST /api/placement/check``  3-5 quick placement questions
- ``POST /api/placement/evaluate`` first skill estimate (overridable by student)
"""
from __future__ import annotations

from fastapi import APIRouter, File, Form, UploadFile

import helper
import pdf_utils
from schemas import PlacementCheck, TopicRequest

router = APIRouter(prefix="/api", tags=["placement"])

TOPIC_EXAMPLES = [
    "Bayesian statistics",
    "Foucault and biopower",
    "Python pandas",
]

_SYSTEM = (
    "You are an expert study coach. Answer strictly with valid JSON, "
    "no prose, no markdown fences."
)


@router.get("/topics")
def list_topics():
    """The suggested topics a student can choose from."""
    return {"topics": TOPIC_EXAMPLES}


@router.post("/upload")
async def upload_material(
    topic: str = Form(...),
    goal: str | None = Form(default=None),
    file: UploadFile = File(...),
):
    """Accept uploaded study material (slides/PDF/notes) and summarize it."""
    summary = pdf_utils.summarize_pdf(file.file)
    return {
        "filename": file.filename,
        "topic": topic,
        "goal": goal,
        "material": summary,
    }


@router.post("/map")
def create_prerequisite_map(body: TopicRequest) -> dict:
    """Visual path: Foundations -> Core -> Applied -> Target topic."""
    context = ""
    if body.notes:
        context = f"\nContext from the student: {body.notes}"

    prompt = (
        f"Topic: {body.topic}\n"
        f"Learning goal: {body.goal or 'understand the topic'}\n"
        f"{context}\n\n"
        "Build a 4-stage prerequisite map. Return JSON exactly like:\n"
        '{"goal": "<restated goal>", "path": ['
        '{"stage": "Foundations", "concepts": ["...", "..."]}, '
        '{"stage": "Core concepts", "concepts": ["...", "..."]}, '
        '{"stage": "Applied concepts", "concepts": ["...", "..."]}, '
        '{"stage": "Target topic", "concepts": ["...", "..."]}]}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )


@router.post("/placement/check")
def create_placement_check(body: TopicRequest) -> dict:
    """3-5 questions sampling Foundations through Applied levels."""
    context = ""
    if body.notes:
        context = f"\nStudent supplied context: {body.notes}"

    prompt = (
        f"Topic: {body.topic}\n{context}\n\n"
        "Write exactly 4 quick multiple-choice questions that sample the "
        "Foundations, Core, Applied and Target levels (one each). Return JSON:\n"
        '{"questions": [{"level": "Foundations", "question": "...", '
        '"options": ["a", "b", "c", "d"], "answer": 0, "hint": "..."}]}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )


@router.post("/placement/evaluate")
def evaluate_placement(body: PlacementCheck) -> dict:
    """Estimate the starting level; the student can override it later."""
    answers = "\n".join(f"- {a}" for a in body.answers)
    prompt = (
        f"Topic: {body.topic}\nStudent answers:\n{answers}\n\n"
        "Estimate the best starting stage: Foundations, Core concepts, "
        "Applied concepts or Target topic. Return JSON:\n"
        '{"estimated_level": "...", "reason": "<short reason>", '
        '"confidence": 0.0-1.0}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )