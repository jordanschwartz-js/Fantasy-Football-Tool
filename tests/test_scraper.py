from unittest.mock import MagicMock, patch

import pytest

from src.ff_tool.db.models import Player, Ranking, get_session
from src.ff_tool.scraper import scrape_fantasy_pros_position


@pytest.fixture
def fantasypros_html() -> str:
    """Return HTML content for a mock FantasyPros page."""
    with open("tests/fantasypros_qb_week1_ppr.html", "r") as f:
        return f.read()


def test_scrape_fantasy_pros_position(fantasypros_html: str) -> None:
    """Test scraping FantasyPros for a single position."""
    mock_response = MagicMock()
    mock_response.content = fantasypros_html
    mock_response.raise_for_status.return_value = None

    with patch("src.ff_tool.scraper.requests.get", return_value=mock_response) as mock_get:
        session = get_session(db_path=":memory:")
        with patch("src.ff_tool.scraper.get_session", return_value=session):
            scrape_fantasy_pros_position(week=1, position="qb", scoring="PPR")

            # Verify that the correct URL was called
            mock_get.assert_called_once_with(
                "https://www.fantasypros.com/nfl/projections/qb.php?week=1&scoring=PPR"
            )

            # Verify that the data was inserted into the database
            rankings = session.query(Ranking).all()
            assert len(rankings) > 0
            assert rankings[0].week == 1
            assert rankings[0].scoring_format == "PPR"

            player = (
                session.query(Player).filter_by(player_id=rankings[0].player_id).first()
            )
            assert player is not None
            assert player.name == "Josh Allen"
            assert player.team == "BUF"
            assert rankings[0].projected_points > 0

            session.close()
