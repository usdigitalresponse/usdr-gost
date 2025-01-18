import functools
import logging
import sys
from typing import Any, Callable, Dict, List

import ddtrace
from ddtrace import tracer
import structlog


def datadog_tracer_injection(logger, log_method, event_dict):
    """See https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/python/"""
    # get correlation ids from current tracer context
    span = tracer.current_span()
    trace_id, span_id = (
        (str((1 << 64) - 1 & span.trace_id), span.span_id) if span else (None, None)
    )

    # add ids to structlog event dictionary
    event_dict["dd.trace_id"] = str(trace_id or 0)
    event_dict["dd.span_id"] = str(span_id or 0)

    # add the env, service, and version configured for the tracer
    event_dict["dd.env"] = ddtrace.config.env or ""
    event_dict["dd.service"] = ddtrace.config.service or ""
    event_dict["dd.version"] = ddtrace.config.version or ""

    return event_dict


shared_processors: List[Callable] = [
    structlog.contextvars.merge_contextvars,
    structlog.processors.add_log_level,
    structlog.processors.TimeStamper(fmt="iso", key="ts"),
    structlog.processors.CallsiteParameterAdder(
        parameters=[
            structlog.processors.CallsiteParameter.FUNC_NAME,
            structlog.processors.CallsiteParameter.PATHNAME,
            structlog.processors.CallsiteParameter.LINENO,
        ]
    ),
    datadog_tracer_injection,
]

processors: List[Callable] = shared_processors + []
if sys.stderr.isatty():
    processors += [
        structlog.dev.ConsoleRenderer(),
    ]
else:
    processors += [
        structlog.processors.dict_tracebacks,
        structlog.processors.EventRenamer("msg"),
        structlog.processors.JSONRenderer(),
    ]

structlog.configure(
    processors=processors,
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    cache_logger_on_first_use=True,
)


def get_logger(*args: str, **kwargs: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(*args, **kwargs)


def reset_contextvars(func: Callable) -> Callable:
    """Decorator that resets context-local log values prior to each call to the
    decorated function.
    """

    @functools.wraps(func)
    def inner(*args: List[Any], **kwargs: Dict[str, Any]) -> Any:
        structlog.contextvars.unbind_contextvars()
        return func(*args, **kwargs)

    return inner
