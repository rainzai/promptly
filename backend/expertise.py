"""PROGRESS: prompt expertise, per prompting skill.

Scores come from reverse-prompt challenges (:mod:`challenges`) and from peer
reviews (:mod:`peer_review`). A skill's score is the average of its last
results, so a single lucky round doesn't make anyone an expert. Peer Reviewer
status needs a high enough level over several challenges. If most of the
students a reviewer helps say it didn't help, reviewing pauses until they have
practised a few more challenges.

- ``GET /api/expertise/{user}``  skill scores, level and Peer Reviewer status

There is deliberately no leaderboard: expertise is about your own skills, not
about ranking students against each other.

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import threading
from dataclasses import dataclass, field

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["expertise"])

# key -> (name, what it covers)
SKILLS = {
    "intent": ("Intent recognition", "what the AI is asked to do, and why"),
    "audience": ("Audience & tone", "who the answer is for, at what level, in what tone"),
    "structure": ("Structure & formatting", "the shape of the answer: lists, sections, tables, order"),
    "constraints": ("Constraints", "limits and requirements: length, scope, what to include or avoid"),
    "iteration": ("Iteration", "improving a prompt based on what went wrong"),
}
# What a single prompt shows; iteration needs a before and an after.
PROMPT_SKILLS = [skill for skill in SKILLS if skill != "iteration"]

RECENT_RESULTS = 10  # a skill's score is the average of its last 10 results
MAX_LEVEL = 10
REVIEWER_MIN_LEVEL = 6
REVIEWER_MIN_CHALLENGES = 5
# Once a reviewer has this many ratings, at least this share must say the review helped,
# or reviewing pauses until they finish RECOVERY_CHALLENGES more challenges.
MIN_RATINGS = 3
MIN_HELPFUL_SHARE = 0.5
RECOVERY_CHALLENGES = 3


class SkillScore(BaseModel):
    skill: str
    name: str
    description: str
    score: int | None = Field(..., description="Average of the last results; null until there is one")
    results: int = Field(..., description="How many results the skill has in total")


class Requirement(BaseModel):
    label: str
    met: bool
    progress: str | None = Field(None, examples=["3 / 5"])


class ExpertiseOut(BaseModel):
    user: str
    skills: list[SkillScore]
    overall: int = Field(..., description="Average of all skill scores, 0 for skills not shown yet")
    level: int = Field(..., ge=1, le=MAX_LEVEL)
    challenges: int
    reviews: int
    helped: int = Field(..., description="Reviews the student said helped")
    not_helped: int
    reviewer: bool = Field(..., description="Can review other students' prompts")
    status: str = Field(..., examples=["Learner", "Peer Reviewer", "Peer Reviewer (paused)"])
    requirements: list[Requirement] = Field(..., description="What Peer Reviewer status takes")


class ExpertiseChange(BaseModel):
    expertise: ExpertiseOut
    level_before: int
    became_reviewer: bool


@dataclass
class _Profile:
    name: str
    # "challenge:<id>" or "review:<id>" -> skill -> score, oldest first
    results: dict[str, dict[str, int]] = field(default_factory=dict)
    # One per rated review: did it help the student?
    ratings: list[bool] = field(default_factory=list)
    # Ratings before this index were already judged by an earlier pause.
    ratings_from: int = 0
    # Reviewing is paused until this many challenges are finished.
    paused_until: int = 0


# normalized user -> profile
_PROFILES: dict[str, _Profile] = {}
_LOCK = threading.Lock()


def user_key(user: str) -> str:
    """Names that differ only in case or spacing are the same user."""
    return " ".join(user.split()).casefold()


def _profile(user: str) -> _Profile:
    return _PROFILES.setdefault(user_key(user), _Profile(name=" ".join(user.split())))


def _challenges(profile: _Profile) -> int:
    return sum(key.startswith("challenge:") for key in profile.results)


def _summary(profile: _Profile) -> ExpertiseOut:
    skills = []
    for skill, (name, description) in SKILLS.items():
        values = [result[skill] for result in profile.results.values() if skill in result]
        recent = values[-RECENT_RESULTS:]
        score = round(sum(recent) / len(recent)) if recent else None
        skills.append(
            SkillScore(
                skill=skill, name=name, description=description, score=score, results=len(values)
            )
        )
    overall = round(sum(s.score or 0 for s in skills) / len(skills))
    challenges = _challenges(profile)
    # Level follows the scores, but takes at least as many results as levels to climb.
    level = max(1, min(MAX_LEVEL, 1 + overall // 10, 1 + len(profile.results)))

    helped = sum(profile.ratings)
    paused = challenges < profile.paused_until
    if paused:
        done = challenges - (profile.paused_until - RECOVERY_CHALLENGES)
        ratings = Requirement(
            label=f"Finish {RECOVERY_CHALLENGES} more challenges, as your last reviews didn't help",
            met=False,
            progress=f"{done} / {RECOVERY_CHALLENGES}",
        )
    else:
        recent = profile.ratings[profile.ratings_from :]
        ratings = Requirement(
            label="Keep at least half of your reviews rated helpful",
            met=True,
            progress=f"{sum(recent)} / {len(recent)} helped" if recent else None,
        )
    requirements = [
        Requirement(
            label=f"Reach level {REVIEWER_MIN_LEVEL}",
            met=level >= REVIEWER_MIN_LEVEL,
            progress=f"{min(level, REVIEWER_MIN_LEVEL)} / {REVIEWER_MIN_LEVEL}",
        ),
        Requirement(
            label=f"Finish {REVIEWER_MIN_CHALLENGES} challenges",
            met=challenges >= REVIEWER_MIN_CHALLENGES,
            progress=f"{min(challenges, REVIEWER_MIN_CHALLENGES)} / {REVIEWER_MIN_CHALLENGES}",
        ),
        ratings,
    ]
    qualified = requirements[0].met and requirements[1].met
    reviewer = qualified and not paused
    if reviewer:
        status = "Peer Reviewer"
    elif qualified:
        status = "Peer Reviewer (paused)"
    else:
        status = "Learner"
    return ExpertiseOut(
        user=profile.name,
        skills=skills,
        overall=overall,
        level=level,
        challenges=challenges,
        reviews=len(profile.results) - challenges,
        helped=helped,
        not_helped=len(profile.ratings) - helped,
        reviewer=reviewer,
        status=status,
        requirements=requirements,
    )


def get_expertise(user: str) -> ExpertiseOut:
    with _LOCK:
        return _summary(_profile(user))


def skill_scores(user: str) -> dict[str, int]:
    """Current score per skill, 0 for skills without results yet."""
    return {s.skill: s.score or 0 for s in get_expertise(user).skills}


def record(user: str, result_id: str, scores: dict[str, int]) -> ExpertiseChange:
    """Store (or replace) the skill scores of one challenge or review."""
    with _LOCK:
        profile = _profile(user)
        before = _summary(profile)
        profile.results[result_id] = {k: v for k, v in scores.items() if k in SKILLS}
        after = _summary(profile)
    return ExpertiseChange(
        expertise=after,
        level_before=before.level,
        became_reviewer=after.reviewer and not before.reviewer,
    )


def rate(reviewer: str, helped: bool) -> None:
    """A student rated one of this reviewer's reviews; too many unhelpful ones pause reviewing."""
    with _LOCK:
        profile = _profile(reviewer)
        profile.ratings.append(helped)
        recent = profile.ratings[profile.ratings_from :]
        if len(recent) >= MIN_RATINGS and sum(recent) / len(recent) < MIN_HELPFUL_SHARE:
            profile.paused_until = _challenges(profile) + RECOVERY_CHALLENGES
            profile.ratings_from = len(profile.ratings)


@router.get("/expertise/{user}")
def expertise(user: str) -> ExpertiseOut:
    """Skill scores, overall level and what Peer Reviewer status takes."""
    return get_expertise(user)
