"""Progress + social layer (in-memory demo state).

- ``POST /api/progress/{user}/xp``   award XP
- ``GET  /api/progress/{user}``      profile: XP, mastery, streak, badges
- ``GET  /api/leaderboard?friends=a,b`` private friend leaderboard

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["progress"])

_BADGES = {
    100: "First steps",
    250: "Foundations",
    500: "Core",
    1000: "Applied",
    2000: "Master",
}

# user_id -> {"xp": int, "streak": int, "last_day": "YYYY-MM-DD"}
_STATE: dict[str, dict] = {}


def _touch(uid: str) -> None:
    today = date.today().isoformat()
    profile = _STATE.setdefault(uid, {"xp": 0, "streak": 0, "last_day": None})
    if profile["last_day"] == today:
        return
    profile["streak"] = 1 if profile["last_day"] is None else profile["streak"] + 1
    profile["last_day"] = today


@router.post("/progress/{user}/xp")
def award_xp(user: str, amount: int) -> dict:
    """Award XP, advance streak, and mint any new badges."""
    _touch(user)
    profile = _STATE[user]
    profile["xp"] += amount
    badges = [b for tier, b in sorted(_BADGES.items()) if profile["xp"] >= tier]
    return {"user": user, "xp": profile["xp"], "streak": profile["streak"], "badges": badges}


@router.get("/progress/{user}")
def get_progress(user: str) -> dict:
    """Return the user's progress profile."""
    _touch(user)
    profile = _STATE[user]
    badges = [b for tier, b in sorted(_BADGES.items()) if profile["xp"] >= tier]
    return {"user": user, **profile, "badges": badges}


@router.get("/leaderboard")
def leaderboard(friends: str = "") -> dict:
    """Private friend leaderboard. ``?friends=alice,bob`` (or none = everyone)."""
    ids = [f.strip() for f in friends.split(",") if f.strip()] if friends else list(_STATE)
    rows = sorted(
        ((uid, p["xp"]) for uid, p in _STATE.items() if uid in ids),
        key=lambda r: r[1],
        reverse=True,
    )
    return {"friends": ids, "ranking": [{"user": uid, "xp": xp} for uid, xp in rows]}