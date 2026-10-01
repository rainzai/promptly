"""Demo data for presenting Promptly, loaded at startup when ``DEMO=1``.

Peer Reviewer status takes several challenges to earn, too long for a live
demo, so this preloads (type the name on any page to become that user):

- **Rae**: a Peer Reviewer with a full expertise profile and helpful reviews
- **Sam**: a learner on the way to Peer Reviewer, whose help request Rae has
  already answered, waiting for Sam's rating
- three open help requests from other students in the review queue

No LLM calls are made. Everything is in memory, so a restart loads it afresh.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import expertise
import peer_review

REVIEWER = "Rae"
LEARNER = "Sam"

# Rae's challenge results: averages of about intent 92, audience 81, structure 95,
# constraints 68, iteration 84 (iteration only when she revised).
_RAE_CHALLENGES = [
    {"intent": 88, "audience": 76, "structure": 93, "constraints": 60, "iteration": 80},
    {"intent": 95, "audience": 84, "structure": 97, "constraints": 70},
    {"intent": 90, "audience": 80, "structure": 94, "constraints": 66, "iteration": 86},
    {"intent": 94, "audience": 83, "structure": 96, "constraints": 72},
    {"intent": 92, "audience": 79, "structure": 95, "constraints": 68, "iteration": 84},
    {"intent": 93, "audience": 84, "structure": 95, "constraints": 72, "iteration": 86},
]
_RAE_REVIEW = {"intent": 92, "audience": 81, "structure": 95, "constraints": 68, "iteration": 84}

_SAM_CHALLENGES = [
    {"intent": 70, "audience": 55, "structure": 72, "constraints": 40},
    {"intent": 78, "audience": 62, "structure": 80, "constraints": 50, "iteration": 60},
]

_OPEN_REQUESTS = [
    {
        "minutes_ago": 14,
        "title": "Regression for a first-year psych student",
        "goal": "An explanation of regression I can actually follow as a first-year psychology student",
        "prompt": "Explain regression.",
        "ai_response": "Regression analysis estimates the conditional expectation E[Y|X] by minimising "
        "the sum of squared residuals; under the Gauss-Markov assumptions the OLS estimator is BLUE.",
        "skills": ["audience", "constraints"],
    },
    {
        "minutes_ago": 9,
        "title": "Revision plan for a networks exam",
        "goal": "A realistic revision plan for my Computer Networks exam next week that fits around "
        "my lectures and my part-time job",
        "prompt": "make a study plan for computer networks",
        "ai_response": "Week 1: Read chapters 1-3.\nWeek 2: Read chapters 4-6.\n...\n"
        "Week 8: Review everything and do practice exams.",
        "skills": ["constraints", "structure"],
    },
    {
        "minutes_ago": 4,
        "title": "Flashcards on microeconomics key terms",
        "goal": "Flashcards to test myself on the key terms from this week's microeconomics lecture",
        "prompt": "make flashcards about microeconomics",
        "ai_response": "Here are 50 flashcards covering all of microeconomics:\n"
        "1. What is economics? The study of scarcity...",
        "skills": ["intent", "constraints"],
    },
]


def seed() -> None:
    now = datetime.now(timezone.utc)

    for i, scores in enumerate(_RAE_CHALLENGES):
        expertise.record(REVIEWER, f"challenge:demo-rae-{i}", scores)
    for i in range(3):
        expertise.record(REVIEWER, f"review:demo-rae-{i}", _RAE_REVIEW)
        expertise.rate(REVIEWER, helped=True)
    for i, scores in enumerate(_SAM_CHALLENGES):
        expertise.record(LEARNER, f"challenge:demo-sam-{i}", scores)

    for i, request in enumerate(_OPEN_REQUESTS):
        peer_review._REQUESTS[f"demo-open-{i}"] = peer_review._Request(
            user=f"demo student {i}",
            title=request["title"],
            goal=request["goal"],
            prompt=request["prompt"],
            ai_response=request["ai_response"],
            skills=request["skills"],
            created_at=now - timedelta(minutes=request["minutes_ago"]),
        )

    peer_review._REQUESTS["demo-sam"] = peer_review._Request(
        user=LEARNER,
        title="Python IndexError explained for a beginner",
        goal="Understand why my Python loop gives an IndexError, in words a beginner understands",
        prompt="why index error",
        ai_response=None,
        skills=["audience", "intent"],
        created_at=now - timedelta(minutes=25),
        review=peer_review.Review(
            reviewer=REVIEWER,
            revised_prompt="I'm a beginner in Python. My for loop stops with 'IndexError: list index "
            "out of range' (my code is below). Explain in simple words why this error happens and "
            "how I can find the cause myself, step by step. Don't rewrite my whole program.\n\n"
            "[paste your code here]",
            note="Saying you're a beginner and asking how to find the cause yourself gets you an "
            "explanation you can learn from, instead of a fixed program.",
            predicted_improvement=64,
            checks=[
                peer_review.Check(label="Audience clarified", ok=True),
                peer_review.Check(label="Error message included", ok=True),
                peer_review.Check(label="Learning goal kept", ok=True),
                peer_review.Check(label="Code still missing", ok=False),
            ],
        ),
    )
