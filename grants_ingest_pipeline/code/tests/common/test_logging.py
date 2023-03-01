import logging as py_logging
import os
from unittest import mock

import logmatic

from common import logging


class TestSetupLogger:
    def test_sets_logger_name(self):
        logger = logging.setup_logger('test_logger')
        assert logger.name == 'test_logger'

    def test_sets_handler_with_json_formatter(self):
        logger = logging.setup_logger('test_logger')
        formatters = [type(handler.formatter) for handler in logger.handlers]
        assert logmatic.JsonFormatter in formatters

    @mock.patch.dict(os.environ, {})
    def test_default_level_fallback_is_info(self):
        assert logging.setup_logger('test_logger').level == py_logging.INFO

    @mock.patch.dict(os.environ, {'LOG_LEVEL': 'ERROR'})
    def test_configures_level_from_env(self):
        assert logging.setup_logger('test_logger').level == py_logging.ERROR

    @mock.patch.dict(os.environ, {})
    def test_configures_explicit_log_level(self):
        assert logging.setup_logger('test_logger', 'DEBUG').level == py_logging.DEBUG
