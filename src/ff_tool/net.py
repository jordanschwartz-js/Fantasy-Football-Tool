import requests
from requests_cache import CachedSession

from ff_tool.config import get_config


class NetworkError(Exception):
    pass


config = get_config()
CACHE_PATH = config.cache_path
CACHE_EXPIRY = config.cache_expiry_hours * 60 * 60


session = CachedSession(
    CACHE_PATH,
    backend="sqlite",
    expire_after=CACHE_EXPIRY,
    allowable_codes=[200],
)


def get(url: str, **kwargs) -> requests.Response:
    try:
        response = session.get(url, **kwargs)
        response.raise_for_status()
        return response
    except requests.exceptions.RequestException as e:
        raise NetworkError(f"Failed to fetch {url}") from e
