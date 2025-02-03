import multiprocessing
import multiprocessing.connection
import multiprocessing.spawn
import os
import signal
import time
from unittest import mock

import pytest
import structlog

from src.lib import shutdown_handler


class TestShutdownHandler:
    """
    Although used as a unit test, this shares similarities with an integration test.
    As the main pytest process may have important signal handlers that we want
    to avoid messing with, we spawn a child process to run the handler and use
    pipe-based communication to observe whether the was handled by `ShutdownHandler`
    and resulted in a clean exit.
    """

    @staticmethod
    def uses_shutdown_handler(conn: multiprocessing.connection.Connection):
        """Creates a `ShutdownHandler` and runs until it requests a shutdown.
        This should only be run in a dedicated child process, which should
        be created using the spawn (not fork) method.

        Note:
            Since the `ShutdownHandler` code being tested runs in a subprocess,
            coverage information may not be available without additional configuration.

        Args:
            conn: Writeable pipe connection used to communicate running state.
                This allows a (main) test process to observe this function's.
        """
        mock_logger = mock.Mock(spec=structlog.stdlib.BoundLogger)
        handler = shutdown_handler.ShutdownHandler(logger=mock_logger)
        conn.send("ready")
        while not handler.is_shutdown_requested():
            time.sleep(0.1)
        conn.send("graceful shutdown")
        return True

    @pytest.mark.parametrize(
        ("signal_to_send", "expect_graceful_shutdown"),
        (
            (signal.SIGINT, True),
            (signal.SIGTERM, True),
            (signal.SIGHUP, False),
        ),
    )
    @pytest.mark.timeout(5)
    def test_handles_expected_signals(self, signal_to_send, expect_graceful_shutdown):
        signal_name = signal.strsignal(signal_to_send)
        ctx = multiprocessing.get_context("spawn")
        readConn, writeConn = ctx.Pipe(duplex=False)
        p = ctx.Process(
            target=self.uses_shutdown_handler,
            name=f"Test {signal_name} signal",
            args=(writeConn,),
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
