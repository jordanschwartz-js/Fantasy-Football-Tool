from unittest.mock import patch, MagicMock

from src.ff_tool.bot import send_waiver_recommendations


def test_send_waiver_recommendations() -> None:
    """Test sending waiver recommendations to Slack."""
    with patch("src.ff_tool.bot.get_config") as mock_get_config:
        mock_get_config.return_value.webhook_url = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        mock_get_config.return_value.league_id = "123"
        mock_get_config.return_value.current_week = 1
        mock_get_config.return_value.faab_budget = 100

        with patch("src.ff_tool.bot.WebhookClient") as mock_webhook_client:
            mock_webhook = MagicMock()
            mock_webhook.send.return_value.status_code = 200
            mock_webhook.send.return_value.body = "ok"
            mock_webhook_client.return_value = mock_webhook

            with patch("src.ff_tool.bot.recommend_waivers") as mock_recommend_waivers:
                mock_recommend_waivers.return_value = [
                    {
                        "player_name": "Player A",
                        "position": "RB",
                        "team": "TEAM1",
                        "score": 25.0,
                        "bid": 10,
                    }
                ]

                send_waiver_recommendations()

                mock_webhook.send.assert_called_once()
                call_args, call_kwargs = mock_webhook.send.call_args
                assert "Waiver Wire Recommendations" in call_kwargs["text"]
                assert "Player A" in call_kwargs["text"]
