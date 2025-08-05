import os
from pathlib import Path
from typing import Optional

import toml  # type: ignore
from pydantic import BaseModel

DEFAULT_CFG = Path.home() / ".config" / "ff_tool.toml"
_ENV = "FF_TOOL_CONFIG"

class Config(BaseModel):  # type: ignore
    league_id: Optional[str] = None
    scoring: Optional[str] = 'ppr'
    db_path: Optional[str] = 'fantasy_football.db'
    cache_path: Optional[str] = '.ff_cache.sqlite'
    cache_expiry_hours: Optional[int] = 24
    retries: Optional[int] = 3
    backoff_factor: Optional[int] = 1
    webhook_url: Optional[str] = None
    current_week: Optional[int] = 1
    faab_budget: Optional[int] = 100
    post_day: Optional[str] = "tue"
    post_hour: Optional[int] = 8

def cfg_path() -> Path:
    """Return the location of the active config file.

    Order of precedence:
    1. Environment variable FF_TOOL_CONFIG
    2. Default file in ~/.config
    """
    return Path(os.getenv(_ENV, DEFAULT_CFG))

def get_config() -> Config:
    path = cfg_path()
    if not path.is_file():
        return Config()
    with open(path, "r") as f:
        data = toml.load(f)
    return Config(**data.get("tool", {}).get("poetry", {}))
