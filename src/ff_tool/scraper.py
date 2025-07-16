import requests
from bs4 import BeautifulSoup
import pandas as pd
from sqlalchemy.orm import Session
from .db.models import WeeklyRanking, get_session

def scrape_fantasy_pros_position(week: int, position: str, scoring: str):
    """
    Scrapes FantasyPros weekly rankings for a specific position and stores them in the database.
    """
    url = f"https://www.fantasypros.com/nfl/projections/{position.lower()}.php?week={week}&scoring={scoring.upper()}"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    table = soup.find("table", {"id": "data"})
    if not table:
        return

    df = pd.read_html(str(table))[0]

    # Clean column names
    df.columns = [
        col[1] if isinstance(col, tuple) else col for col in df.columns
    ]
    df.columns = [col.lower().replace(" ", "_") for col in df.columns]

    # Rename columns for consistency
    df = df.rename(columns={"player": "player_name"})

    session = get_session()
    for _, row in df.iterrows():
        # The player name in fantasypros has the team abbreviation next to it.
        # e.g. "Josh Allen BUF"
        player_name_parts = row["player_name"].rsplit(" ", 1)
        player_name = player_name_parts[0]
        team = player_name_parts[1] if len(player_name_parts) > 1 else "N/A"

        ranking = WeeklyRanking(
            week=week,
            scoring=scoring,
            position=position.upper(),
            player_name=player_name,
            team=team,
            projection=row.get("fpts", 0.0),
        )
        session.add(ranking)
    session.commit()
    session.close()

def scrape_all_positions(week: int, scoring: str):
    """
    Scrapes FantasyPros weekly rankings for all positions and stores them in the database.
    """
    positions = ["qb", "rb", "wr", "te", "dst", "k"]
    for position in positions:
        scrape_fantasy_pros_position(week, position, scoring)
