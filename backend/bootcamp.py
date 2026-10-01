"""Train: the bootcamp.

Each level contains concepts, a tiny explanation, 2-4 questions, optional
hints, and an "I already know this" skip.

- ``GET  /api/bootcamp/{topic}``        generate the levels
- ``POST /api/bootcamp/{level}/answer`` grade a question answer
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

import helper

router = APIRouter(prefix="/api", tags=["bootcamp"])

_SYSTEM = (
    "You are an expert study coach. Answer strictly with valid JSON, "
    "no prose, no markdown fences."
)


class Answer(BaseModel):
    topic: str
    question: str
    answer: str
    hint: str | None = None


@router.get("/bootcamp/{topic}")
def get_bootcamp(topic: str) -> dict:
    """Generate the bootcamp levels for the topic."""
    prompt = (
        f"Topic: {topic}\n\n"
        "Design 4 bootcamp levels that follow Foundations -> Core -> Applied "
        "-> Target. For each level return concepts to understand, a tiny "
        "explanation or source reference, and 2-4 quiz questions. Return JSON:\n"
        '{"levels": [{"level": 1, "name": "Foundations", '
        '"concepts": ["..."], "explanation": "...", '
        '"questions": [{"question": "...", "options": ["a", "b", "c"], '
        '"answer": 0, "hint": "..."}]}]}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )


@router.post("/bootcamp/{level}/answer")
def grade_answer(level: int, body: Answer) -> dict:
    """Grade a single bootcamp answer and allow skipping unconditionally."""
    if body.answer.lower() in {"skip", "i already know this"}:
        return {"correct": None, "skipped": True, "message": "Level noted as already known."}

    prompt = (
        f"Topic: {body.topic} (level {level})\n"
        f"Question: {body.question}\n"
        f"Student answer: {body.answer}\n"
        f"Hint shown: {body.hint or 'none'}\n\n"
        "Grade the answer. Return JSON:\n"
        '{"correct": true|false, "explanation": "...", "suggested_review": "..."}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )