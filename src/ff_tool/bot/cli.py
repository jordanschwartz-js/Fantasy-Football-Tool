from pathlib import Path
from typing import Annotated

import typer

from ff_tool.config import cfg_path
from ff_tool.scheduler_core import add_schedule, list_schedules

app = typer.Typer()

from typing import Optional


@app.command("schedule-add") # type: ignore
def schedule_add(cron: str, cfg: Annotated[Optional[Path], typer.Option("--config")] = None) -> None:
    path = cfg_path()
    add_schedule(cron, config_path=str(path))
    print(f"Successfully added schedule: {cron}")

@app.command("schedule-list") # type: ignore
def schedule_list(cfg: Annotated[Optional[Path], typer.Option("--config")] = None) -> None:
    path = cfg_path()
    schedules = list_schedules(config_path=str(path))
    if schedules:
        print("Current schedules:")
        for schedule in schedules:
            print(f"  - {schedule}")
    else:
        print("No schedules found.")

@app.command("run") # type: ignore
def run() -> None:
    from ff_tool.bot import run_bot
    run_bot()
