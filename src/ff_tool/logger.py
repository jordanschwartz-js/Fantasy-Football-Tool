import sys

from loguru import logger


def setup_logger() -> None:
    """
    Sets up the logger with a file sink that rotates weekly.
    """
    logger.remove()
    logger.add(sys.stderr, level="INFO")
    logger.add(
        "logs/ff_tool.log",
        rotation="1 week",
        retention="1 month",
        level="INFO",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )
