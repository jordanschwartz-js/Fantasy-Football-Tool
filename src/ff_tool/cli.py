import typer
from .scraper import scrape_all_positions
from .sleeper import Sleeper
from .config import get_config
from typing import Optional

app = typer.Typer()
config = get_config()

@app.command()
def scraper(
    week: int,
    scoring: str = typer.Option(str(config.scoring), help="Scoring format (e.g., ppr, half-ppr, standard)"),
) -> None:
    """
    Scrape FantasyPros weekly projections.
    """
    scrape_all_positions(week, scoring)
    print(f"Successfully scraped week {week} for {scoring} scoring.")

@app.command()
def sleeper_sync(
    league_id: Optional[str] = typer.Option(config.league_id, help="Sleeper league ID"),
) -> None:
    """
    Sync league data from Sleeper.
    """
    if not league_id:
        raise typer.BadParameter("league_id is required. Provide it via CLI or config file.")
    sleeper = Sleeper(league_id)
    sleeper.sync_league()
    print(f"Successfully synced league {league_id}.")


@app.command()
def trade(
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
    week: int,
    budget: int,
    league_id: Optional[str] = typer.Option(config.league_id, help="Sleeper league ID"),
) -> None:
    """
    Get waiver wire recommendations.
    """
    from .waiver import recommend_waivers

    if not league_id:
        raise typer.BadParameter("league_id is required. Provide it via CLI or config file.")

    recommendations = recommend_waivers(league_id, week, budget)

    print("Waiver Wire Recommendations:")
    for rec in recommendations:
        print(
            f"  - {rec['player_name']} ({rec['position']}, {rec['team']}): "
            f"Score={rec['score']:.2f}, Bid=${rec['bid']}"
        )


@app.command()
def bot() -> None:
    """
    Run the waiver wire bot.
    """
    from .bot import run_bot

    run_bot()


if __name__ == "__main__":
    from .logger import setup_logger

    setup_logger()
    app()
