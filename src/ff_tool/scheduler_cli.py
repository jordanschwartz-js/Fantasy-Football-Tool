from typer import Typer

from ff_tool.scheduler_core import add_schedule, list_schedules

app = Typer()

@app.command("schedule-add") # type: ignore
def cli_add(cron: str) -> None:
    add_schedule(cron)

@app.command("schedule-list") # type: ignore
def cli_list() -> None:
    list_schedules()
