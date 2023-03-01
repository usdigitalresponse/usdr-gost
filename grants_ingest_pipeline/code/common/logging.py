import logging
import os

import logmatic


def setup_logger(name: str, level: str = None) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level or os.environ.get('LOG_LEVEL', 'INFO'))
    handler = logging.StreamHandler()
    formatter = logmatic.JsonFormatter(
        fmt='%(message)s %(levelname)s %(pathname)s %(funcName)s %(lineno)d'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger
