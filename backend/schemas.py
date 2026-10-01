"""Pydantic request/response models shared by the routers."""
from __future__ import annotations

from pydantic import BaseModel, Field


class TopicRequest(BaseModel):
    """A learning goal with optional study material and context notes."""

    topic: str = Field(..., examples=["Bayesian statistics"])
    goal: str | None = Field(
        None, examples=["prepare for Week 3 lecture", "prepare for exam"]
    )
    notes: str | None = Field(None, description="Extra context or free text notes")


class PlacementQuestion(BaseModel):
    level: str
    question: str
    options: list[str]
    answer: int


class PlacementCheck(BaseModel):
    topic: str
    questions: list[PlacementQuestion] = Field(
        ..., description="The questions exactly as returned by /api/placement/check"
    )
    answers: list[int] = Field(..., description="Index of the chosen option, one per question")


class CheckpointSubmission(BaseModel):
    topic: str
    question: str = Field(..., description="The question from POST /api/checkpoint/{topic}")
    rubric: list[str] = Field(default_factory=list, description="The rubric returned with it")
    answer: str