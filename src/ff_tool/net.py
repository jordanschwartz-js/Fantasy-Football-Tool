from typing import Any

import requests
from loguru import logger
from requests_cache import CachedSession

from ff_tool.config import get_config


class NetworkError(Exception):
    pass


config = get_config()
CACHE_PATH = config.cache_path if config.cache_path else ".ff_cache"
CACHE_EXPIRY = (config.cache_expiry_hours or 1) * 60 * 60


session = CachedSession(
    CACHE_PATH,
    backend="sqlite",
    expire_after=CACHE_EXPIRY,
    allowable_codes=[200],
)


def get(url: str, **kwargs: Any) -> requests.Response:
    try:
        response = session.get(url, **kwargs)
        if response.from_cache:
            logger.info(f"Cache hit for {url}")
        else:
            logger.info(f"Cache miss for {url}")
        response.raise_for_status()
        return response
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch {url}: {e}")
        raise NetworkError(f"Failed to fetch {url}") from e
