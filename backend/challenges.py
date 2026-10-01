"""PLAY: reverse-prompt challenges.

The model writes a hidden prompt a student might send to an AI assistant, and
answers it. The player sees only the answer and writes the prompt they think
produced it. That prompt is scored per skill (see :mod:`expertise`). One
revision is allowed, which also scores Iteration. Finishing reveals the hidden
prompt.

- ``POST /api/challenges``                                a new challenge for a user
- ``GET  /api/challenges/{challenge_id}``                 the challenge so far (to resume it)
- ``POST /api/challenges/{challenge_id}/attempts``        submit a prompt, get scored
- ``POST /api/challenges/{challenge_id}/reveal``          stop revising and see the hidden prompt

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import random
import threading
import uuid
from dataclasses import dataclass, field

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

import expertise
import helper

router = APIRouter(prefix="/api", tags=["challenges"])

MAX_ATTEMPTS = 2  # a first try and one revision

THEMES = [
    "explaining a concept from a university course to a specific audience",
    "summarising a short text that is included in the prompt",
    "making a study plan for an exam",
    "drafting an email to a lecturer, tutor or project group",
    "writing practice questions about a topic",
    "comparing two theories, methods or tools",
    "giving feedback on a short paragraph that is included in the prompt",
    "brainstorming ideas for a project or essay topic",
    "rewriting a short text that is included in the prompt for a different reader",
    "explaining what a short piece of code does",
    "turning lecture notes that are included in the prompt into flashcards",
    "preparing for a presentation or oral exam",
]

# difficulty -> what the hidden prompt specifies
DIFFICULTIES = {
    1: "a clear task plus one or two specifics, such as the audience or the format",
    2: "a clear task, the audience or tone, the format, and one constraint",
    3: "a clear task, audience and tone, a precise structure, and two or more constraints "
    "(length, what to include, what to avoid)",
}

_HIDDEN_PROMPT = """You design reverse-prompting challenges for university students who are learning
to write good prompts for AI assistants such as UvA AI Chat.
Write one realistic prompt a student could send. It specifies {spec}.
It is self-contained: any text the task is about is included in the prompt itself.
It contains no personal information, and leads to an answer of at most 200 words.
Write it in English, the way a student would type it.

Respond with only a JSON object: {{"prompt": "..."}}"""

_GRADER = """You grade a reverse-prompting game. A hidden prompt produced the AI answer below.
The player saw only the answer and wrote the prompt they think produced it.
Score how well the player's prompt recovers each aspect of the hidden prompt, from 0 to 100.
Judge meaning, not wording: a different prompt that would produce essentially the same answer
deserves full marks.
- intent: {intent}
- audience: {audience}
- structure: {structure}
- constraints: {constraints}
If the hidden prompt leaves an aspect open, give 100 when the player left it open too, and less
when they added requirements the answer does not show.
For each skill, write one short tip that points the player to evidence in the AI answer, such as
"Look at the vocabulary: who is this written for?". Tips are hints, not solutions: never state
the hidden prompt's audience, format, numbers or wording. For a score of 90 or more, say briefly
what they got right.
{iteration}
Respond with only a JSON object with the keys {keys}, each {{"score": <0-100>, "tip": "..."}}."""

_ASSISTANT = "You are UvA AI Chat, a helpful assistant for university students."

_ITERATION = """This is the player's revision. Their first prompt and the tips they got are below.
Also score iteration: how well the revision acted on the tips, fixing weak aspects without
breaking strong ones (0 if nothing meaningful changed)."""


class ChallengeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user: str = Field(..., min_length=1, max_length=60)


class AttemptRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    prompt: str = Field(..., min_length=3, max_length=2000)


class SkillResult(BaseModel):
    skill: str
    name: str
    score: int
    tip: str


class Attempt(BaseModel):
    prompt: str
    scores: list[SkillResult]
    overall: int = Field(..., description="Average of this attempt's skill scores")


class ChallengeOut(BaseModel):
    challenge_id: str
    user: str
    theme: str
    difficulty: int = Field(..., ge=1, le=3)
    answer: str = Field(..., description="The AI answer the player has to find the prompt for")
    attempts: list[Attempt]
    max_attempts: int
    finished: bool
    hidden_prompt: str | None = Field(None, description="Revealed once the challenge is finished")


class AttemptResult(BaseModel):
    challenge: ChallengeOut
    change: expertise.ExpertiseChange


class _HiddenPrompt(BaseModel):
    prompt: str = Field(..., min_length=10)


class _Grade(BaseModel):
    score: int = Field(..., ge=0, le=100)
    tip: str


class _Grades(BaseModel):
    intent: _Grade
    audience: _Grade
    structure: _Grade
    constraints: _Grade
    iteration: _Grade | None = None


@dataclass
class _Challenge:
    user: str
    theme: str
    difficulty: int
    hidden_prompt: str
    answer: str
    attempts: list[Attempt] = field(default_factory=list)
    finished: bool = False
    grading: bool = False  # an attempt is being scored right now


_CHALLENGES: dict[str, _Challenge] = {}
_LOCK = threading.Lock()


def _out(challenge_id: str, c: _Challenge) -> ChallengeOut:
    return ChallengeOut(
        challenge_id=challenge_id,
        user=c.user,
        theme=c.theme,
        difficulty=c.difficulty,
        answer=c.answer,
        attempts=c.attempts,
        max_attempts=MAX_ATTEMPTS,
        finished=c.finished,
        hidden_prompt=c.hidden_prompt if c.finished else None,
    )


def _get(challenge_id: str) -> _Challenge:
    challenge = _CHALLENGES.get(challenge_id)
    if challenge is None:
        raise HTTPException(404, "Challenge not found")
    return challenge


def _grade(c: _Challenge, prompt: str) -> Attempt:
    revision = bool(c.attempts)
    skills = expertise.PROMPT_SKILLS + (["iteration"] if revision else [])
    task = (
        f"Hidden prompt:\n{c.hidden_prompt}\n\nAI answer:\n{c.answer}\n\n"
        f"Player's prompt:\n{prompt}"
    )
    if revision:
        first = c.attempts[0]
        tips = "\n".join(f"- {s.name}: {s.tip}" for s in first.scores)
        task += f"\n\nPlayer's first prompt:\n{first.prompt}\n\nTips they got:\n{tips}"
    system = _GRADER.format(
        **{skill: expertise.SKILLS[skill][1] for skill in expertise.PROMPT_SKILLS},
        iteration=_ITERATION if revision else "",
        keys=", ".join(skills),
    )
    grades = helper.chat_model(_Grades, system, task)
    if revision and grades.iteration is None:
        raise helper.LLMError("Model did not score iteration")
    scores = [
        SkillResult(
            skill=skill,
            name=expertise.SKILLS[skill][0],
            score=getattr(grades, skill).score,
            tip=getattr(grades, skill).tip,
        )
        for skill in skills
    ]
    overall = round(sum(s.score for s in scores) / len(scores))
    return Attempt(prompt=prompt, scores=scores, overall=overall)


def _expertise_scores(c: _Challenge) -> dict[str, int]:
    """What the challenge counts for: the best score per skill, so revising never costs points."""
    best: dict[str, int] = {}
    for attempt in c.attempts:
        for s in attempt.scores:
            best[s.skill] = max(best.get(s.skill, 0), s.score)
    return best


@router.post("/challenges")
def create_challenge(body: ChallengeRequest) -> ChallengeOut:
    """A new reverse-prompt challenge, harder as the player's level goes up."""
    level = expertise.get_expertise(body.user).level
    difficulty = 1 if level <= 3 else 2 if level <= 6 else 3
    theme = random.choice(THEMES)
    hidden = helper.chat_model(
        _HiddenPrompt,
        _HIDDEN_PROMPT.format(spec=DIFFICULTIES[difficulty]),
        f"Theme: {theme}",
        temperature=0.9,
    )
    answer = helper.chat(
        [
            {"role": "system", "content": _ASSISTANT},
            {"role": "user", "content": hidden.prompt},
        ],
        max_tokens=800,
    ).strip()
    challenge_id = uuid.uuid4().hex
    challenge = _Challenge(
        user=body.user,
        theme=theme,
        difficulty=difficulty,
        hidden_prompt=hidden.prompt,
        answer=answer,
    )
    with _LOCK:
        _CHALLENGES[challenge_id] = challenge
    return _out(challenge_id, challenge)


@router.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: str) -> ChallengeOut:
    """The challenge with the attempts so far."""
    challenge = _get(challenge_id)
    with _LOCK:
        return _out(challenge_id, challenge)


@router.post("/challenges/{challenge_id}/attempts")
def submit_attempt(challenge_id: str, body: AttemptRequest) -> AttemptResult:
    """Score a prompt. The second attempt also scores Iteration and finishes the challenge."""
    challenge = _get(challenge_id)
    with _LOCK:
        if challenge.finished:
            raise HTTPException(409, "This challenge is finished")
        if challenge.grading:
            raise HTTPException(409, "Your previous prompt is still being scored")
        if challenge.attempts and challenge.attempts[-1].prompt == body.prompt:
            raise HTTPException(422, "Change your prompt before trying again")
        challenge.grading = True
    try:
        attempt = _grade(challenge, body.prompt)
    finally:
        with _LOCK:
            challenge.grading = False
    with _LOCK:
        challenge.attempts.append(attempt)
        challenge.finished = len(challenge.attempts) >= MAX_ATTEMPTS
        scores = _expertise_scores(challenge)
        out = _out(challenge_id, challenge)
    change = expertise.record(challenge.user, f"challenge:{challenge_id}", scores)
    return AttemptResult(challenge=out, change=change)


@router.post("/challenges/{challenge_id}/reveal")
def reveal(challenge_id: str) -> ChallengeOut:
    """Finish without revising and see the hidden prompt."""
    challenge = _get(challenge_id)
    with _LOCK:
        if not challenge.attempts:
            raise HTTPException(409, "Try at least once before revealing the prompt")
        if challenge.grading:
            raise HTTPException(409, "Your prompt is still being scored")
        challenge.finished = True
        return _out(challenge_id, challenge)
