# One container for the whole app: FastAPI serves the API and the built frontend.

FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PATH="/app/.venv/bin:$PATH"
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY pdf.py ./
COPY backend/ backend/
COPY --from=frontend /app/frontend/dist frontend/dist

# One worker: the app keeps its data in memory. Hosts like Render set $PORT and put a
# proxy in front, whose X-Forwarded-For header gives each visitor's IP for the AI limits.
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
