import signal

import structlog


class ShutdownHandler:
    def __init__(self, logger: structlog.stdlib.BoundLogger):
        self._logger = logger
        self._shutdown_requested = False
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    def _handle_signal(self, signum, frame):
        self._logger.warn(
            "shutdown signal received; requesting shutdown...",
            signal=signal.strsignal(signum),
        )
        self._shutdown_requested = True

    def is_shutdown_requested(self):
        return self._shutdown_requested
