from unittest.mock import patch, MagicMock
import pytest
from ff_tool.sleeper import Sleeper
from ff_tool.db.models import get_session, League, Roster, Player

@pytest.fixture
def sleeper_league_data():
    return {
        "league_id": "12345",
        "name": "Test League",
    }

@pytest.fixture
def sleeper_rosters_data():
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

def test_sync_league(sleeper_league_data, sleeper_rosters_data):
    # Mock the responses from requests.get
    mock_league_response = MagicMock()
    mock_league_response.json.return_value = sleeper_league_data

    mock_rosters_response = MagicMock()
    mock_rosters_response.json.return_value = sleeper_rosters_data

    with patch("requests.get") as mock_get:
        mock_get.side_effect = [mock_league_response, mock_rosters_response]

        # Use an in-memory SQLite database for testing
        session = get_session(db_path=":memory:")

        with patch("ff_tool.sleeper.get_session", return_value=session):
            sleeper = Sleeper("12345")
            sleeper.sync_league()

            # Verify that the data was inserted into the database
            league = session.query(League).first()
            assert league.league_id == "12345"
            assert league.name == "Test League"

            rosters = session.query(Roster).all()
            assert len(rosters) == 2
            assert rosters[0].roster_id == 1
            assert rosters[0].owner_id == "owner1"
            assert rosters[1].roster_id == 2
            assert rosters[1].owner_id == "owner2"

            players = session.query(Player).all()
            assert len(players) == 6

            session.close()
