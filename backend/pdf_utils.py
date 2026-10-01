"""Glue between FastAPI file uploads and the :mod:`pdf` module."""
from __future__ import annotations

from typing import BinaryIO

import pdf

from config import MAX_UPLOAD_CHARS


def summarize_pdf(file: BinaryIO, max_chars: int = MAX_UPLOAD_CHARS) -> dict:
    """Extract text + page count from an uploaded (spooled) PDF.

    Returns a dict with ``page_count``, ``char_count``, ``text`` (trimmed
    to ``max_chars``) and ``truncated``.
    """
    page_count = pdf.get_page_count(file)
    file.seek(0)
    text = pdf.extract_text(file)
    return {
        "page_count": page_count,
        "char_count": len(text),
        "text": text[:max_chars],
        "truncated": len(text) > max_chars,
    }