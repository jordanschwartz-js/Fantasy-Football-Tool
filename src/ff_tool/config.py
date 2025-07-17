import toml
from pydantic import BaseModel
from typing import Optional

class Config(BaseModel):
    league_id: Optional[str] = None
    scoring: Optional[str] = 'ppr'
    db_path: Optional[str] = 'fantasy_football.db'
    cache_path: Optional[str] = '.ff_cache.sqlite'
    cache_expiry_hours: Optional[int] = 24
    retries: Optional[int] = 3
    backoff_factor: Optional[int] = 1

def get_config(config_path: str = 'ff_tool.toml') -> Config:
    try:
        with open(config_path, 'r') as f:
            config_data = toml.load(f)
        return Config(**config_data.get('tool', {}).get('poetry', {}))
    except FileNotFoundError:
        return Config()
