FROM python:3.13-alpine AS app_base

# Define build argument defaults
ARG GIT_COMMIT=""
ARG GIT_REF=""
ARG TIMESTAMP=""

WORKDIR /app
RUN pip install poetry
COPY ./arpa-exporter /app
RUN poetry install --no-dev

# Inject build-time environment variables
ENV BUILD_GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_GIT_REF=${GIT_REF}
ENV BUILD_TIMESTAMP=${TIMESTAMP}

RUN adduser -D worker

# Start the daemon
USER worker
CMD ["ddtrace-run", "python", "./main.py"]
