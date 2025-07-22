import typer
from .scraper import scrape_all_positions
from .sleeper import Sleeper
from .config import get_config
from typing import Optional
from pathlib import Path

class AppState:
    def __init__(self) -> None:
        self.config = None

app_state = AppState()

app = typer.Typer()

@app.callback()
def main(ctx: typer.Context, config: str = typer.Option("ff_tool.toml", help="Path to config file.")) -> None:
    """
    Fantasy Football Tool
    """
    ctx.obj = get_config(config)

@app.command()
def scraper(
    ctx: typer.Context,
    week: int,
    scoring: str = typer.Option(None, help="Scoring format (e.g., ppr, half-ppr, standard)"),
) -> None:
    """
    Scrape FantasyPros weekly projections.
    """
    scoring = scoring or ctx.obj.scoring
    scrape_all_positions(week, scoring)
    print(f"Successfully scraped week {week} for {scoring} scoring.")

@app.command()
def sleeper_sync(
    ctx: typer.Context,
    league_id: Optional[str] = typer.Option(None, help="Sleeper league ID"),
) -> None:
    """
    Sync league data from Sleeper.
    """
    league_id = league_id or ctx.obj.league_id
    if not league_id:
        raise typer.BadParameter("league_id is required. Provide it via CLI or config file.")
    sleeper = Sleeper(league_id)
    sleeper.sync_league()
    print(f"Successfully synced league {league_id}.")


@app.command()
def trade(
    ctx: typer.Context,
    you_send: str = typer.Argument(..., help="Comma-separated list of player names you send"),
    for_trade: str = typer.Option(..., "--for", help="Comma-separated list of player names you get"),
) -> None:
    """
    Analyze a fantasy football trade.
    """
    from .trade import analyze_trade

    assets_out = [p.strip() for p in you_send.split(',')]
    assets_in = [p.strip() for p in for_trade.split(',')]

    analysis = analyze_trade(assets_out, assets_in)

    print("Trade Analysis:")
    print(f"  You send: {', '.join(analysis['assets_out']['players'])}")
    print(f"  You get: {', '.join(analysis['assets_in']['players'])}")
    print(f"  Point differential: {analysis['delta']:.2f}")
    print(f"  Percentage change: {analysis['percentage_change']:.2f}%")
    print(f"  Recommendation: {analysis['recommendation']}")


@app.command()
def waiver(
    ctx: typer.Context,
    week: int,
    budget: int,
    league_id: Optional[str] = typer.Option(None, help="Sleeper league ID"),
) -> None:
    """
    Get waiver wire recommendations.
    """
    from .waiver import recommend_waivers

    league_id = league_id or ctx.obj.league_id
    if not league_id:
        raise typer.BadParameter("league_id is required. Provide it via CLI or config file.")

    recommendations = recommend_waivers(league_id, week, budget)

    print("Waiver Wire Recommendations:")
    for rec in recommendations:
        print(
            f"  - {rec['player_name']} ({rec['position']}, {rec['team']}): "
            f"Score={rec['score']:.2f}, Bid=${rec['bid']}"
        )


bot_app = typer.Typer()

@bot_app.command("run")
def bot_run(ctx: typer.Context) -> None:
    """
    Run the waiver wire bot.
    """
    from .bot import run_bot

    run_bot()

@bot_app.command("schedule")
def bot_schedule(
    ctx: typer.Context,
    cron_string: str = typer.Argument(..., help="Cron string for the schedule (e.g., 'Tue 08:00')"),
) -> None:
    """
    Schedule the waiver wire bot.
    """
    import toml

    day_of_week, time = cron_string.split()
    hour, minute = time.split(":")
    config_path = ctx.parent.params["config"] if ctx.parent and ctx.parent.params else "ff_tool.toml"
    with open(config_path, "r") as f:
        config_data = toml.load(f)
    if "tool" not in config_data:
        config_data["tool"] = {}
    if "poetry" not in config_data["tool"]:
        config_data["tool"]["poetry"] = {}
    config_data["tool"]["poetry"]["post_day"] = day_of_week.lower()
    config_data["tool"]["poetry"]["post_hour"] = int(hour)
    with open(config_path, "w") as f:
        toml.dump(config_data, f)
    print(f"Scheduled the bot to run every {day_of_week} at {hour}:{minute}.")

app.add_typer(bot_app, name="bot")


@app.command()
def doctor(ctx: typer.Context) -> None:
    """
    Checks the system for required credentials and paths.
    """
    config = ctx.obj
    print("Checking system configuration...")
    if config.league_id:
        print("✓ Sleeper league ID is configured.")
    else:
        print("✗ Sleeper league ID is not configured.")
    if config.webhook_url:
        print("✓ Slack webhook URL is configured.")
    else:
        print("✗ Slack webhook URL is not configured.")
    # Check if cache path exists
    if config.cache_path and Path(config.cache_path).exists():
        print("✓ Cache path exists.")
    else:
        print("✗ Cache path does not exist.")


if __name__ == "__main__":
    from .logger import setup_logger

    setup_logger()
    app()
