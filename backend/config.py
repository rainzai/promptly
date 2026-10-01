"""Central configuration, read from the environment / .env file."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

LLM_API_BASE_URL: str = os.getenv("LLM_API_BASE_URL", "https://llmproxy.uva.nl")
LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
# Override after listing models: `cd backend && python helper.py` shows what's available.
LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-5.4-mini")

# Number of characters of uploaded material sent to the LLM.
MAX_UPLOAD_CHARS: int = int(os.getenv("MAX_UPLOAD_CHARS", "20000"))