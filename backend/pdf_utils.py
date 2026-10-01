"""Glue between FastAPI file uploads and the :mod:`pdf` module."""
from __future__ import annotations

import re
from typing import BinaryIO

from fastapi import HTTPException

import pdf

from config import MAX_UPLOAD_CHARS

_SPACES = re.compile(r"[ \t]+")
_BLANK_LINES = re.compile(r"\n(?: ?\n)+")


def summarize_pdf(file: BinaryIO, max_chars: int = MAX_UPLOAD_CHARS) -> dict:
    """Extract text + page count from an uploaded (spooled) PDF.

    Returns a dict with ``page_count``, ``char_count``, ``text`` (trimmed
    to ``max_chars``) and ``truncated``.
    """
    try:
        page_count = pdf.get_page_count(file)
        file.seek(0)
        text = pdf.extract_text(file)
    except pdf.fitz.FileDataError as exc:
        raise HTTPException(400, "Could not read the file as a PDF.") from exc
    # Slide layouts come out padded with long runs of spaces; collapse them
    # so max_chars is spent on content instead of padding.
    text = _BLANK_LINES.sub("\n\n", _SPACES.sub(" ", text))
    return {
        "page_count": page_count,
        "char_count": len(text),
        "text": text[:max_chars],
        "truncated": len(text) > max_chars,
    }
