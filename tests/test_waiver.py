from unittest.mock import patch

from ff_tool.db.models import Player
from ff_tool.waiver import get_free_agents, recommend_waivers


def test_get_free_agents() -> None:
    """Test getting free agents from the Sleeper API."""
    # Mock players
    player1 = Player(player_id="1", name="Player A", position="RB", team="TEAM1")
    player2 = Player(player_id="2", name="Player B", position="WR", team="TEAM1")
    player3 = Player(player_id="3", name="Player C", position="QB", team="TEAM2")

    with patch("ff_tool.waiver.get_session") as mock_get_session:
        mock_session = mock_get_session.return_value
        mock_session.query.return_value.all.return_value = [player1, player2, player3]

        with patch("ff_tool.waiver.Sleeper") as mock_sleeper:
            mock_sleeper.return_value.get_rosters.return_value = [
                {"players": ["1"]},
                {"players": ["2"]},
            ]

            free_agents = get_free_agents(league_id="123")

            assert len(free_agents) == 1
            assert free_agents[0].name == "Player C"


def test_recommend_waivers() -> None:
    """Test the waiver wire recommender with mock data."""
    # Mock players
    player3 = Player(player_id="3", name="Player C", position="QB", team="TEAM2")
    player4 = Player(player_id="4", name="Player D", position="TE", team="TEAM2")

    # Mock free agents
    free_agents = [player3, player4]

    with patch("ff_tool.waiver.get_free_agents", return_value=free_agents):
        with patch("ff_tool.waiver.get_ros_projected_points") as mock_get_ros:
            # Mock ROS projected points
            mock_get_ros.side_effect = [25.0, 10.0]

            # Recommend waivers
            recommendations = recommend_waivers(league_id="123", week=1, budget=100)

            # Assert the results
            assert len(recommendations) == 2
            assert recommendations[0]["player_name"] == "Player C"
            assert recommendations[0]["score"] == 25.0
            assert recommendations[1]["player_name"] == "Player D"
            assert recommendations[1]["score"] == 10.0
