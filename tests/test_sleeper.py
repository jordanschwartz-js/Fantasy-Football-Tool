from unittest.mock import patch, MagicMock
import pytest
from src.ff_tool.sleeper import Sleeper
from src.ff_tool.db.models import get_session, Roster, Player
from typing import Any, Dict, List

@pytest.fixture
def sleeper_rosters_data() -> List[Dict[str, Any]]:
    return [
        {
            "roster_id": 1,
            "owner_id": "owner1",
            "players": ["1", "2", "3"],
        },
        {
            "roster_id": 2,
            "owner_id": "owner2",
            "players": ["4", "5", "6"],
        },
    ]

def test_sync_league(sleeper_rosters_data: List[Dict[str, Any]]) -> None:
    # Mock the responses from ff_tool.net.get
    with patch("ff_tool.net.session.get") as mock_get:
        mock_get.return_value.json.return_value = sleeper_rosters_data

        # Use an in-memory SQLite database for testing
        session = get_session(db_path=":memory:")

        with patch("src.ff_tool.sleeper.get_session", return_value=session):
            sleeper = Sleeper("12345")
            sleeper.sync_league()

            # Verify that the data was inserted into the database
            rosters = session.query(Roster).all()
            assert len(rosters) == 6

            players = session.query(Player).all()
            assert len(players) == 6

            session.close()
