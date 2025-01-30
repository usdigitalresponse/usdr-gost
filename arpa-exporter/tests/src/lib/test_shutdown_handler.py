import multiprocessing
import multiprocessing.connection
import os
import signal
import time
from unittest import mock

import pytest
import structlog

from src.lib import shutdown_handler


@pytest.mark.parametrize(
    ("signal_to_send", "expect_graceful_shutdown"),
    (
        (signal.SIGINT, True),
        (signal.SIGTERM, True),
        (signal.SIGHUP, False),
    ),
)
@pytest.mark.timeout(5)
def test_ShutdownHandler(signal_to_send, expect_graceful_shutdown):
    def handled_scenario(conn: multiprocessing.connection.Connection):
        mock_logger = mock.Mock(spec=structlog.stdlib.BoundLogger)
        handler = shutdown_handler.ShutdownHandler(logger=mock_logger)
        conn.send("ready")
        while not handler.is_shutdown_requested():
            time.sleep(0.1)
        conn.send("graceful shutdown")
        return

    signal_name = signal.strsignal(signal_to_send)
    readConn, writeConn = multiprocessing.Pipe(duplex=False)
    p = multiprocessing.Process(
        target=handled_scenario, name=f"Test {signal_name} signal", args=(writeConn,)
    )
    p.start()
    assert p.is_alive(), "handled_sccenario subprocess could not start"
    try:
        # Wait subprocess indicates readiness
        msg = readConn.recv()
        assert msg == "ready", (
            f'expected "ready" message from subprocess pipe but received "{msg}"'
        )
        os.kill(p.pid, signal_to_send)
        p.join()
    finally:
        # Ensure the subprocess is always shut down so pytest doesn't hang
        p.kill()
        writeConn.close()

    p.join()
    result = None
    try:
        result = readConn.recv()
    except EOFError:
        pass

    if expect_graceful_shutdown:
        assert result == "graceful shutdown", (
            f'sent "{signal_name}" signal but subprocess did not shut down gracefully'
        )
    else:
        assert result is None, (
            f'subprocess seems to have unexpectedly handled "{signal_name}" signal'
        )
