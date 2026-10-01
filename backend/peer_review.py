"""CONTRIBUTE: peer help with prompts.

A student who isn't getting what they want from UvA AI Chat asks for help with
just their goal, their prompt and, optionally, the answer they got: never the
whole conversation, and reviewers never see who asked. Peer Reviewers (see
:mod:`expertise`) get the open requests that best match their strengths first
and suggest a better prompt. Before it goes back, the AI checks the revision:
the predicted improvement, what it fixes or still misses, and that the
reviewer helped the student ask rather than doing the task for them. The
student then rates whether it helped, which counts towards the reviewer's
status, and the review itself counts towards the reviewer's expertise.

- ``POST /api/help-requests``                         ask for help
- ``GET  /api/help-requests?user=``                   your requests and their reviews
- ``GET  /api/help-requests/{request_id}``            one request
- ``POST /api/help-requests/{request_id}/rating``     did the review help?
- ``GET  /api/reviews/queue?reviewer=``               open requests, best matches first
- ``POST /api/help-requests/{request_id}/check``      AI check of a draft revision
- ``POST /api/help-requests/{request_id}/review``     send the revision to the student

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import re
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

import expertise
import helper

router = APIRouter(prefix="/api", tags=["peer review"])

# Requests are shown to other students, so requests containing these are refused.
_PERSONAL_INFO = {
    "an email address": re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+"),
    "a phone number": re.compile(
        r"\+\d{2,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}|\b06[\s-]?\d{8}\b"
    ),
    "a student number": re.compile(
        r"\b(?:student\s*(?:number|nr|no|id)|studentnummer)\b\W{0,3}\d{6,8}", re.IGNORECASE
    ),
}
_NOT_A_REVIEWER = "Only Peer Reviewers can review requests. Play challenges to unlock it."
STRONG_SKILL = 70  # a reviewer score from which a skill counts as one of their strengths

_TAG_PROMPT = f"""A university student wants help writing a better prompt for an AI assistant.
From their goal and prompt, write a short, neutral title for the request (at most 8 words, no
personal details), and pick the 1 to 3 prompting skills that would help them most:
- intent: {expertise.SKILLS["intent"][1]}
- audience: {expertise.SKILLS["audience"][1]}
- structure: {expertise.SKILLS["structure"][1]}
- constraints: {expertise.SKILLS["constraints"][1]}

Respond with only a JSON object: {{"title": "...", "skills": ["audience"]}}"""

_CHECK_PROMPT = """You check a peer reviewer's revision of a student's prompt before it goes back to
the student. The reviewer's job is to help the student tell the AI what they want, never to do
the student's academic task for them.

Return:
- predicted_improvement: an integer from -100 to 100, how much better the revised prompt will
  achieve the student's goal than the original, in percent.
- checks: 3 to 5 short checks on the revision, each {"label": "...", "ok": true or false}, for what
  it fixes (such as "Audience clarified", "Example requested") and what it still misses (such as
  "No length constraint"). Labels are at most 5 words.
- scores from 0 to 100 for the prompting skills the revision shows: intent (keeps and sharpens
  the student's goal; low if it changes the goal), audience, structure, constraints, and
  iteration (how much it improves on the original prompt).
- integrity_ok: false if the revised prompt or the reviewer's note does the academic task itself,
  for example contains the explanation, solution or finished text the student needs; otherwise
  true. integrity_note: one sentence on why, or null.

Respond with only a JSON object:
{"predicted_improvement": 0, "checks": [{"label": "...", "ok": true}],
 "scores": {"intent": 0, "audience": 0, "structure": 0, "constraints": 0, "iteration": 0},
 "integrity_ok": true, "integrity_note": null}"""


class HelpRequestIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user: str = Field(..., min_length=1, max_length=60, description="Never shown to reviewers")
    goal: str = Field(..., min_length=10, max_length=1000, description="What they want to achieve")
    prompt: str = Field(..., min_length=3, max_length=4000, description="The prompt that isn't working")
    ai_response: str | None = Field(None, max_length=6000, description="The answer they got")


class SkillTag(BaseModel):
    skill: str
    name: str


class Check(BaseModel):
    label: str
    ok: bool


class Review(BaseModel):
    reviewer: str
    revised_prompt: str
    note: str | None
    predicted_improvement: int
    checks: list[Check]


class HelpRequestOut(BaseModel):
    request_id: str
    title: str
    goal: str
    prompt: str
    ai_response: str | None
    skills: list[SkillTag] = Field(..., description="The prompting skills that would help most")
    status: Literal["waiting", "reviewed", "rated"]
    created_at: datetime
    review: Review | None
    helped: bool | None = Field(..., description="The student's rating of the review")


class QueueItem(BaseModel):
    request: HelpRequestOut
    match: int = Field(..., description="Reviewer's average score in the skills the request needs")
    strengths: list[str] = Field(..., description="Needed skills the reviewer is strong in")


class RatingIn(BaseModel):
    user: str = Field(..., min_length=1)
    helped: bool


class ReviewIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    reviewer: str = Field(..., min_length=1)
    revised_prompt: str = Field(..., min_length=3, max_length=4000)
    note: str | None = Field(None, max_length=1000, description="Why these changes help")


class ReviewCheck(BaseModel):
    predicted_improvement: int
    checks: list[Check]
    integrity_ok: bool
    integrity_note: str | None


class ReviewResult(BaseModel):
    request: HelpRequestOut
    check: ReviewCheck
    change: expertise.ExpertiseChange


class _Tags(BaseModel):
    title: str
    skills: list[Literal["intent", "audience", "structure", "constraints"]] = Field(
        ..., min_length=1, max_length=3
    )


class _Scores(BaseModel):
    intent: int = Field(..., ge=0, le=100)
    audience: int = Field(..., ge=0, le=100)
    structure: int = Field(..., ge=0, le=100)
    constraints: int = Field(..., ge=0, le=100)
    iteration: int = Field(..., ge=0, le=100)


class _Evaluation(ReviewCheck):
    predicted_improvement: int = Field(..., ge=-100, le=100)
    checks: list[Check] = Field(..., min_length=1, max_length=6)
    scores: _Scores


@dataclass
class _Request:
    user: str
    title: str
    goal: str
    prompt: str
    ai_response: str | None
    skills: list[str]
    created_at: datetime
    review: Review | None = None
    helped: bool | None = None


_REQUESTS: dict[str, _Request] = {}
_LOCK = threading.Lock()


def _status(r: _Request) -> str:
    if r.review is None:
        return "waiting"
    return "reviewed" if r.helped is None else "rated"


def _out(request_id: str, r: _Request) -> HelpRequestOut:
    return HelpRequestOut(
        request_id=request_id,
        title=r.title,
        goal=r.goal,
        prompt=r.prompt,
        ai_response=r.ai_response,
        skills=[SkillTag(skill=s, name=expertise.SKILLS[s][0]) for s in r.skills],
        status=_status(r),
        created_at=r.created_at,
        review=r.review,
        helped=r.helped,
    )


def _get(request_id: str) -> _Request:
    request = _REQUESTS.get(request_id)
    if request is None:
        raise HTTPException(404, "Help request not found")
    return request


def _check_reviewer(reviewer: str, request: _Request) -> None:
    if not expertise.get_expertise(reviewer).reviewer:
        raise HTTPException(403, _NOT_A_REVIEWER)
    if expertise.user_key(reviewer) == expertise.user_key(request.user):
        raise HTTPException(403, "You can't review your own request")
    if request.review is not None:
        raise HTTPException(409, "Someone else already reviewed this request")


def _evaluate(request: _Request, body: ReviewIn) -> _Evaluation:
    parts = [f"Student's goal:\n{request.goal}", f"Original prompt:\n{request.prompt}"]
    if request.ai_response:
        parts.append(f"Answer the student got:\n{request.ai_response}")
    parts.append(f"Revised prompt:\n{body.revised_prompt}")
    parts.append(f"Reviewer's note:\n{body.note or '(none)'}")
    return helper.chat_model(_Evaluation, _CHECK_PROMPT, "\n\n".join(parts))


@router.post("/help-requests")
def create_help_request(body: HelpRequestIn) -> HelpRequestOut:
    """Ask a Peer Reviewer for help with a prompt."""
    fields = {"goal": body.goal, "prompt": body.prompt, "AI answer": body.ai_response or ""}
    found = [
        f"{kind} in your {name}"
        for name, text in fields.items()
        for kind, pattern in _PERSONAL_INFO.items()
        if pattern.search(text)
    ]
    if found:
        raise HTTPException(422, f"Remove personal information before sharing: {'; '.join(found)}.")
    tags = helper.chat_model(_Tags, _TAG_PROMPT, f"Goal:\n{body.goal}\n\nPrompt:\n{body.prompt}")
    request = _Request(
        user=body.user,
        title=tags.title,
        goal=body.goal,
        prompt=body.prompt,
        ai_response=body.ai_response or None,
        skills=list(dict.fromkeys(tags.skills)),
        created_at=datetime.now(timezone.utc),
    )
    request_id = uuid.uuid4().hex
    with _LOCK:
        _REQUESTS[request_id] = request
        return _out(request_id, request)


@router.get("/help-requests")
def list_help_requests(user: str) -> list[HelpRequestOut]:
    """The user's own requests, newest first."""
    key = expertise.user_key(user)
    with _LOCK:
        mine = [(rid, r) for rid, r in _REQUESTS.items() if expertise.user_key(r.user) == key]
        mine.sort(key=lambda item: item[1].created_at, reverse=True)
        return [_out(rid, r) for rid, r in mine]


@router.get("/help-requests/{request_id}")
def get_help_request(request_id: str) -> HelpRequestOut:
    request = _get(request_id)
    with _LOCK:
        return _out(request_id, request)


@router.post("/help-requests/{request_id}/rating")
def rate_review(request_id: str, body: RatingIn) -> HelpRequestOut:
    """The student says whether the review helped; this counts towards the reviewer's status."""
    request = _get(request_id)
    with _LOCK:
        if expertise.user_key(body.user) != expertise.user_key(request.user):
            raise HTTPException(403, "Only the student who asked can rate the review")
        if request.review is None:
            raise HTTPException(409, "This request has no review yet")
        if request.helped is not None:
            raise HTTPException(409, "You already rated this review")
        request.helped = body.helped
        reviewer = request.review.reviewer
        out = _out(request_id, request)
    expertise.rate(reviewer, body.helped)
    return out


@router.get("/reviews/queue")
def review_queue(reviewer: str) -> list[QueueItem]:
    """Open requests for a Peer Reviewer: best match for their strengths first, then oldest."""
    if not expertise.get_expertise(reviewer).reviewer:
        raise HTTPException(403, _NOT_A_REVIEWER)
    scores = expertise.skill_scores(reviewer)
    key = expertise.user_key(reviewer)
    with _LOCK:
        open_requests = [
            (rid, r)
            for rid, r in _REQUESTS.items()
            if r.review is None and expertise.user_key(r.user) != key
        ]
        items = [
            QueueItem(
                request=_out(rid, r),
                match=round(sum(scores[s] for s in r.skills) / len(r.skills)),
                strengths=[expertise.SKILLS[s][0] for s in r.skills if scores[s] >= STRONG_SKILL],
            )
            for rid, r in open_requests
        ]
    return sorted(items, key=lambda item: (-item.match, item.request.created_at))


@router.post("/help-requests/{request_id}/check")
def check_review(request_id: str, body: ReviewIn) -> ReviewCheck:
    """Let the AI check a draft revision before sending it; nothing is saved."""
    request = _get(request_id)
    _check_reviewer(body.reviewer, request)
    evaluation = _evaluate(request, body)
    return ReviewCheck.model_validate(evaluation.model_dump())


@router.post("/help-requests/{request_id}/review")
def submit_review(request_id: str, body: ReviewIn) -> ReviewResult:
    """Send the revision to the student. It counts towards the reviewer's expertise."""
    request = _get(request_id)
    _check_reviewer(body.reviewer, request)
    evaluation = _evaluate(request, body)
    if not evaluation.integrity_ok:
        raise HTTPException(
            422,
            "Help the student ask, don't do the task for them. "
            + (evaluation.integrity_note or "Your revision answers the task itself."),
        )
    review = Review(
        reviewer=" ".join(body.reviewer.split()),
        revised_prompt=body.revised_prompt,
        note=body.note or None,
        predicted_improvement=evaluation.predicted_improvement,
        checks=evaluation.checks,
    )
    with _LOCK:
        if request.review is not None:
            raise HTTPException(409, "Someone else already reviewed this request")
        request.review = review
        out = _out(request_id, request)
    change = expertise.record(body.reviewer, f"review:{request_id}", evaluation.scores.model_dump())
    check = ReviewCheck.model_validate(evaluation.model_dump())
    return ReviewResult(request=out, check=check, change=change)
