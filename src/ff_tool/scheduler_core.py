from typing import List

import toml  # type: ignore


def add_schedule(cron_string: str, config_path: str = "ff_tool.toml") -> None:
    """Adds a cron schedule to the config file."""
    try:
        with open(config_path, "r") as f:
            config = toml.load(f)
    except FileNotFoundError:
        config = {}

    if "bot" not in config:
        config["bot"] = {}
    config["bot"]["schedule"] = cron_string

    with open(config_path, "w") as f:
        toml.dump(config, f)

def list_schedules(config_path: str = "ff_tool.toml") -> List[str]:
    """Lists the cron schedules from the config file."""
    try:
        with open(config_path, "r") as f:
            config = toml.load(f)
    except FileNotFoundError:
        return []

    if "bot" in config and "schedule" in config["bot"]:
        return [config["bot"]["schedule"]]
    return []

from typing import Any, Dict


def _parse_cron(cron_string: str) -> Dict[str, Any]:
    """Parses a cron string into a dictionary."""
    parts = cron_string.split()
    day_of_week = parts[0].lower()
    hour, minute = parts[1].split(":")
    return {"day_of_week": day_of_week, "hour": int(hour), "minute": int(minute)}
