"""Prove: the mastery checkpoint.

A harder question that connects several concepts. Passing it unlocks the
next stage of the study path.

- ``POST /api/checkpoint/{topic}``         generate the mastery question
- ``POST /api/checkpoint/{topic}/evaluate`` grade it, unlock on pass
"""
from __future__ import annotations

from fastapi import APIRouter

import helper
from schemas import CheckpointSubmission

router = APIRouter(prefix="/api", tags=["checkpoint"])

_SYSTEM = (
    "You are an expert study coach. Answer strictly with valid JSON, "
    "no prose, no markdown fences."
)


@router.post("/checkpoint/{topic}")
def get_checkpoint(topic: str) -> dict:
    """One integrative question that forces the learner to connect concepts."""
    prompt = (
        f"Topic: {topic}\n\n"
        "Write one mastery-checkpoint question that requires connecting "
        "at least two core concepts. Return JSON:\n"
        '{"question": "...", "rubric": ["points to address"], '
        '"model_answer": "..."}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
    )


@router.post("/checkpoint/{topic}/evaluate")
def evaluate_checkpoint(topic: str, body: CheckpointSubmission) -> dict:
    """Grade against the rubric; pass unlocks the next stage."""
    rubric = "\n".join(f"- {point}" for point in body.rubric) or "- (no rubric given)"
    prompt = (
        f"Topic: {topic}\nQuestion: {body.question}\nRubric:\n{rubric}\n"
        f"Student answer:\n{body.answer}\n\n"
        "Grade against the rubric, on whether the answer connects the concepts "
        "a human expert would require. Return JSON:\n"
        '{"passed": true|false, "score": 0.0-1.0, '
        '"feedback": "...", "unlocks_stage": "..."}'
    )
    return helper.chat_json(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )