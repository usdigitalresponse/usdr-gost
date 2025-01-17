FROM python:3.13-slim-bookworm AS app_builder

# Configure and install poetry
ARG POETRY_VERSION=2.0.1
ENV POETRY_HOME=/opt/poetry
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_IN_PROJECT=1
ENV POETRY_VIRTUALENVS_CREATE=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_CACHE_DIR=/opt/.cache
RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app
COPY ./arpa-exporter/pyproject.toml ./arpa-exporter/poetry.lock /app/
RUN poetry install --only main --sync --no-interaction --no-ansi --no-root && rm -rf $POETRY_CACHE_DIR

# Dev environments
FROM app_builder AS app_runtime_dev
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN poetry install --sync --no-interaction --no-ansi --no-root
CMD ["python", "-m", "src.worker"]

# Production runtime
FROM python:3.13-slim-bookworm AS app_runtime

# Inject build-time environment variables
ARG GIT_COMMIT=""
ARG GIT_REF=""
ARG TIMESTAMP=""
ENV BUILD_GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_GIT_REF=${GIT_REF}
ENV BUILD_TIMESTAMP=${TIMESTAMP}
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY --from=app_builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}
COPY ./arpa-exporter/src/ /app/src/

RUN adduser worker

# Start the daemon
USER worker
CMD ["ddtrace-run", "python", "-m", "src.worker"]
