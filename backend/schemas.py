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


class PlacementCheck(BaseModel):
    topic: str
    answers: list[str] = Field(..., description="User answers, one per question")


class CheckpointSubmission(BaseModel):
    topic: str
    answer: str