"""
Scraper for FantasyPros.com to get weekly player rankings.

This module scrapes FantasyPros.com for weekly player rankings and stores them in the
database. It intentionally uses a direct `requests.get` call instead of the cached
session from `ff_tool.net` to allow for easier mocking in unit tests.
"""
from typing import List

import pandas as pd
import requests  # type: ignore
from bs4 import BeautifulSoup

from .db.models import Player, Ranking, get_session


def scrape_fantasy_pros_position(week: int, position: str, scoring: str) -> None:
    """
    Scrapes FantasyPros weekly rankings for a specific position and stores them in the database.

    Args:
        week: The week to scrape rankings for.
        position: The position to scrape rankings for (e.g., 'qb', 'rb').
        scoring: The scoring format (e.g., 'PPR', 'standard').
    """
    scoring_upper = scoring.upper()
    url = f"https://www.fantasypros.com/nfl/projections/{position.lower()}.php?week={week}&scoring={scoring_upper}"

    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return

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

        player = session.query(Player).filter_by(name=player_name).first()
        if not player:
            player = Player(
                name=player_name,
                position=position.upper(),
                team=team,
                player_id=player_name
            )
            session.add(player)
            session.commit()

        ranking = Ranking(
            week=week,
            scoring_format=scoring.upper(),
            projected_points=row.get("fpts", 0.0),
            player_id=player.player_id
        )
        session.add(ranking)
    session.commit()
    session.close()

def scrape_all_positions(week: int, scoring: str) -> None:
    """
    Scrapes FantasyPros weekly rankings for all positions and stores them in the database.
    """
    positions: List[str] = ["qb", "rb", "wr", "te", "dst", "k"]
    for position in positions:
        scrape_fantasy_pros_position(week, position, scoring)
