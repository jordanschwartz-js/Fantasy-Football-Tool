import typer
from .scraper import scrape_all_positions
from .sleeper import Sleeper
from .config import get_config, Config
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

if __name__ == "__main__":
    app()
