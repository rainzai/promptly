"""Helpers for talking to an OpenAI-compatible chat API (Gemini by default).

Which API, model and key are set in config.py. Ready-made functions:

- :func:`list_models`      -> what models the API exposes
- :func:`chat`             -> free-form prompt, returns assistant text
- :func:`chat_json`        -> prompt expecting a JSON object/array on stdout
- :func:`chat_model`       -> JSON validated against a pydantic model
"""
from __future__ import annotations

import json
from typing import Any, TypeVar

import requests
from pydantic import BaseModel, ValidationError

import limits
from config import LLM_API_BASE_URL, LLM_API_KEY, LLM_AUTH_HEADER, LLM_MODEL, LLM_TEMPERATURE


class LLMError(RuntimeError):
    """Raised when the API rejects a request or a response is not valid JSON."""


class LLMBusy(LLMError):
    """The API is rate-limiting us or is overloaded; trying again later should work."""


class LLMBadOutput(LLMError):
    """The reply wasn't the JSON we asked for; asking again usually works."""


def _headers() -> dict[str, str]:
    if not LLM_API_KEY:
        raise LLMError("LLM_API_KEY is not set. Add it to .env (see .env.example).")
    if LLM_AUTH_HEADER.lower() == "authorization":
        return {"Authorization": f"Bearer {LLM_API_KEY}"}
    return {LLM_AUTH_HEADER: LLM_API_KEY}


def _request(method: str, path: str, *, timeout: float, **kwargs: Any) -> Any:
    """Call the API and return the JSON body; every failure becomes an LLMError."""
    try:
        resp = requests.request(
            method, f"{LLM_API_BASE_URL}{path}", headers=_headers(), timeout=timeout, **kwargs
        )
        resp.raise_for_status()
    except requests.HTTPError as exc:
        status = exc.response.status_code
        error = LLMBusy if status in (429, 503) else LLMError
        raise error(f"LLM API returned {status}: {exc.response.text[:300]}") from exc
    except requests.RequestException as exc:
        raise LLMError(f"Could not reach the LLM API: {exc}") from exc
    return resp.json()


def list_models() -> list[str]:
    """Return the model ids exposed by the API."""
    return [model["id"] for model in _request("GET", "/models", timeout=30)["data"]]


def chat(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int | None = None,
    json_mode: bool = False,
) -> str:
    """Send a chat request and return the assistant's text reply.

    ``json_mode`` makes the model reply with a valid JSON object (OpenAI's JSON mode, which
    Gemini, Groq, OpenRouter and Ollama support too).
    """
    limits.spend()
    payload: dict[str, Any] = {
        "model": model or LLM_MODEL,
        "messages": messages,
        "temperature": temperature if LLM_TEMPERATURE is None else LLM_TEMPERATURE,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = _request("POST", "/chat/completions", json=payload, timeout=120)
    return data["choices"][0]["message"]["content"]


def chat_json(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    json_mode: bool = False,
) -> Any:
    """Send a chat request and parse the reply as JSON.

    Tolerates ```json fences and prose around the JSON. Raises
    :class:`LLMBadOutput` if the reply contains no valid JSON.
    """
    content = chat(messages, model=model, temperature=temperature, json_mode=json_mode).strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    # Fall back to the outermost {...} or [...] span.
    starts = [i for i in (content.find("{"), content.find("[")) if i != -1]
    if starts:
        start = min(starts)
        end = content.rfind("}" if content[start] == "{" else "]")
        try:
            return json.loads(content[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise LLMBadOutput(f"Model did not return valid JSON: {content[:500]}")


Model = TypeVar("Model", bound=BaseModel)

# The frontend shows these strings as is. Gemini otherwise writes maths in LaTeX ($1011_2$).
_PLAIN_TEXT = (
    "Every string in your JSON is shown to the student as plain text, so use no Markdown "
    "or LaTeX: write maths as plain text, such as 1011 (binary), 0x2F or 2^8."
)


def chat_model(schema: type[Model], system: str, user: str, *, temperature: float = 0.2) -> Model:
    """Ask for a JSON object and validate it against a pydantic model.

    Long structured answers are occasionally malformed or the wrong shape, even in JSON
    mode; one retry usually fixes it.
    """
    messages = [
        {"role": "system", "content": f"{system}\n\n{_PLAIN_TEXT}"},
        {"role": "user", "content": user},
    ]
    for _ in range(2):
        try:
            return schema.model_validate(chat_json(messages, temperature=temperature, json_mode=True))
        except (ValidationError, LLMBadOutput) as exc:
            error = exc
    raise LLMBadOutput(f"Model response wasn't the JSON we asked for: {error}") from error


if __name__ == "__main__":  # pragma: no cover
    import sys

    try:
        for mid in list_models():
            print(mid)
    except Exception as exc:  # noqa: BLE001 - report and exit non-zero
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc