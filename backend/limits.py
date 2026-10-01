"""Per-visitor limits on AI calls, so one visitor can't use up a public demo's free quota.

main.py records who is making each request (by IP address) and helper.chat charges
every AI call to them. Calls made outside a request, such as scripts, aren't limited.
"""
from __future__ import annotations

import threading
import time
from collections import deque
from contextvars import ContextVar

from config import VISITOR_AI_CALLS_PER_DAY, VISITOR_AI_CALLS_PER_MINUTE

visitor: ContextVar[str | None] = ContextVar("visitor", default=None)

_DAY = 24 * 60 * 60
_calls: dict[str, deque[float]] = {}
_lock = threading.Lock()


class TooManyCalls(Exception):
    """The visitor made too many AI calls; the message says when to try again."""


def spend() -> None:
    """Charge one AI call to the current visitor, or raise TooManyCalls."""
    who = visitor.get()
    if who is None:
        return
    now = time.monotonic()
    with _lock:
        calls = _calls.setdefault(who, deque())
        while calls and now - calls[0] > _DAY:
            calls.popleft()
        if len(calls) >= VISITOR_AI_CALLS_PER_DAY:
            raise TooManyCalls(
                f"You've used your {VISITOR_AI_CALLS_PER_DAY} AI requests for today on this "
                "demo. Try again tomorrow."
            )
        if sum(1 for t in calls if now - t < 60) >= VISITOR_AI_CALLS_PER_MINUTE:
            raise TooManyCalls("That's a lot of AI requests in one minute. Wait a moment and try again.")
        calls.append(now)
