from pathlib import Path
from typing import Annotated

import typer

from ff_tool.config import cfg_path
from ff_tool.schedule import add_schedule, list_schedules

app = typer.Typer()

@app.command("schedule-add")
def schedule_add(cron: str, cfg: Annotated[Path, typer.Option("--config")] = None):
    path = cfg_path()
    add_schedule(cron, config_path=str(path))
    print(f"Successfully added schedule: {cron}")

@app.command("schedule-list")
def schedule_list(cfg: Annotated[Path, typer.Option("--config")] = None):
    path = cfg_path()
    schedules = list_schedules(config_path=str(path))
    if schedules:
        print("Current schedules:")
        for schedule in schedules:
            print(f"  - {schedule}")
    else:
        print("No schedules found.")

@app.command("run")
def run():
    from ff_tool.bot import run_bot
    run_bot()
