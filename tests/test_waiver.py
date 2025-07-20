from unittest.mock import patch

from src.ff_tool.db.models import Player
from src.ff_tool.waiver import recommend_waivers


def test_recommend_waivers() -> None:
    """Test the waiver wire recommender with mock data."""
    # Mock players
    player3 = Player(player_id="3", name="Player C", position="QB", team="TEAM2")
    player4 = Player(player_id="4", name="Player D", position="TE", team="TEAM2")

    # Mock free agents
    free_agents = [player3, player4]

    with patch("src.ff_tool.waiver.get_free_agents", return_value=free_agents):
        with patch("src.ff_tool.waiver.get_ros_projected_points") as mock_get_ros:
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
