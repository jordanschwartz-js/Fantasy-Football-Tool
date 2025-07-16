from unittest.mock import patch, MagicMock
import pytest
from bs4 import BeautifulSoup
from src.ff_tool.scraper import scrape_fantasy_pros_position
from src.ff_tool.db.models import get_session, Ranking, Player
from typing import Any

@pytest.fixture
def fantasypros_html() -> str:
    with open("tests/fantasypros_qb_week1_ppr.html", "r") as f:
        return f.read()

def test_scrape_fantasy_pros_position(fantasypros_html: str) -> None:
    # Mock the response from requests.get
    mock_response = MagicMock()
    mock_response.content = fantasypros_html

    with patch("requests.get", return_value=mock_response):
        # Use an in-memory SQLite database for testing
        session = get_session(db_path=":memory:")

        with patch("src.ff_tool.scraper.get_session", return_value=session):
            scrape_fantasy_pros_position(week=1, position="qb", scoring="PPR")

            # Verify that the data was inserted into the database
            rankings = session.query(Ranking).all()
            assert len(rankings) > 0
            assert rankings[0].week == 1
            assert rankings[0].scoring_format == "PPR"

            player = session.query(Player).filter_by(player_id=rankings[0].player_id).first()
            assert player is not None
            assert player.name == "Josh Allen"
            assert player.team == "BUF"
            assert rankings[0].projected_points > 0

            session.close()
