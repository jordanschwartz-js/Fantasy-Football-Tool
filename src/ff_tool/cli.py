import typer
from .scraper import scrape_all_positions
from .sleeper import Sleeper

app = typer.Typer()

@app.command()
def scraper(week: int, scoring: str = "ppr"):
    """
    Scrape FantasyPros weekly projections.
    """
    scrape_all_positions(week, scoring)
    print(f"Successfully scraped week {week} for {scoring} scoring.")

@app.command()
def sleeper_sync(league_id: str):
    """
    Sync league data from Sleeper.
    """
    sleeper = Sleeper(league_id)
    sleeper.sync_league()
    print(f"Successfully synced league {league_id}.")

if __name__ == "__main__":
    app()
