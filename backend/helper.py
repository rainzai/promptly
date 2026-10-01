"""Helpers for talking to the UvA LLM proxy gateway (llmproxy.uva.nl).

The proxy speaks the OpenAI chat-completions protocol and authenticates
with an ``x-litellm-api-key`` header. Ready-made functions:

- :func:`list_models`      -> what models the proxy exposes
- :func:`chat`             -> free-form prompt, returns assistant text
- :func:`chat_json`        -> prompt expecting a JSON object/array on stdout
"""
from __future__ import annotations

import json
from typing import Any

import requests

from config import LLM_API_BASE_URL, LLM_API_KEY, LLM_MODEL


class LLMError(RuntimeError):
    """Raised when the proxy rejects a request or a response is not valid JSON."""


def _headers() -> dict[str, str]:
    if not LLM_API_KEY:
        raise LLMError("LLM_API_KEY is not set. Add it to backend/.env (see main.py).")
    return {"x-litellm-api-key": LLM_API_KEY}


def list_models() -> list[str]:
    """Return the model ids exposed by the proxy."""
    resp = requests.get(f"{LLM_API_BASE_URL}/v1/models", headers=_headers(), timeout=30)
    resp.raise_for_status()
    return [model["id"] for model in resp.json()["data"]]


def chat(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> str:
    """Send a chat request and return the assistant's text reply."""
    payload: dict[str, Any] = {
        "model": model or LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens

    resp = requests.post(
        f"{LLM_API_BASE_URL}/v1/chat/completions",
        headers=_headers(),
        json=payload,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def chat_json(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.2,
) -> Any:
    """Send a chat request and parse the reply as JSON.

    Strips common ```json fences before parsing. Raises :class:`LLMError`
    if the reply is not valid JSON.
    """
    content = chat(messages, model=model, temperature=temperature).strip()
    if content.startswith("```"):
        content = content.split("```", 2)[1]
        if content.startswith("json"):
            content = content[4:]
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model did not return valid JSON: {content[:500]}") from exc


if __name__ == "__main__":  # pragma: no cover
    import sys

    try:
        for mid in list_models():
            print(mid)
    except Exception as exc:  # noqa: BLE001 - report and exit non-zero
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc