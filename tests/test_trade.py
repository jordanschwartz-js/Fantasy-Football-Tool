from typing import Any
from unittest.mock import MagicMock, patch

from ff_tool.db.models import Player, Ranking
from ff_tool.trade import analyze_trade


def test_analyze_trade() -> None:
    """Test the trade analyzer with mock data."""
    # Mock players
    player1 = Player(player_id="1", name="Player A", position="RB", team="TEAM1")
    player2 = Player(player_id="2", name="Player B", position="WR", team="TEAM1")
    player3 = Player(player_id="3", name="Player C", position="QB", team="TEAM2")
    player4 = Player(player_id="4", name="Player D", position="TE", team="TEAM2")

    # Mock rankings
    ranking1 = Ranking(player_id="1", week=1, projected_points=20.0, scoring_format="PPR")
    ranking2 = Ranking(player_id="2", week=1, projected_points=15.0, scoring_format="PPR")
    ranking3 = Ranking(player_id="3", week=1, projected_points=25.0, scoring_format="PPR")
    ranking4 = Ranking(player_id="4", week=1, projected_points=10.0, scoring_format="PPR")

    with patch("ff_tool.trade.get_session") as mock_get_session:
        # Mock the session and query results
        mock_session = mock_get_session.return_value
        def mock_query_func(model: Any) -> MagicMock:
            query = MagicMock()
            if model == Player:
                query.filter_by.side_effect = lambda **kwargs: MagicMock(first=lambda: next((p for p in [player1, player2, player3, player4] if p.name == kwargs['name']), None))
            elif model == Ranking:
                query.filter_by.side_effect = lambda **kwargs: MagicMock(all=lambda: [r for r in [ranking1, ranking2, ranking3, ranking4] if r.player_id == kwargs['player_id']])
            return query
        mock_session.query.side_effect = mock_query_func

        # Define the trade
        assets_out = ["Player A", "Player B"]
        assets_in = ["Player C", "Player D"]

        # Analyze the trade
        analysis = analyze_trade(assets_out, assets_in)

        # Assert the results
        assert analysis["assets_out"]["total_points"] == 35.0
        assert analysis["assets_in"]["total_points"] == 35.0
        assert analysis["delta"] == 0.0
        assert analysis["percentage_change"] == 0.0
        assert analysis["recommendation"] == "Decline"
