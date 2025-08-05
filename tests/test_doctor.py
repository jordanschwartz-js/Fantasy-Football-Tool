from unittest.mock import patch

from typer.testing import CliRunner

from ff_tool.cli import app

runner = CliRunner()

def test_doctor_all_ok():
    """
    Tests that the doctor command prints all OK messages when the config is valid.
    """
    with patch("ff_tool.doctor.get_config") as mock_get_config:
        mock_get_config.return_value.db_path = "/tmp/ff_tool.db"
        mock_get_config.return_value.league_id = "12345"
        mock_get_config.return_value.webhook_url = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        result = runner.invoke(app, ["doctor"])
        assert result.exit_code == 0
        assert "✓ DB path is writable." in result.stdout
        assert "✓ Sleeper league ID is configured." in result.stdout
        assert "✓ Slack webhook URL is configured." in result.stdout

def test_doctor_no_db_path():
    """
    Tests that the doctor command prints a warning when the db path is not writable.
    """
    with patch("ff_tool.doctor.get_config") as mock_get_config:
        mock_get_config.return_value.db_path = "/root/ff_tool.db"
        mock_get_config.return_value.league_id = "12345"
        mock_get_config.return_value.webhook_url = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        result = runner.invoke(app, ["doctor"])
        assert result.exit_code == 0
        assert "✗ DB path is not writable." in result.stdout
        assert "✓ Sleeper league ID is configured." in result.stdout
        assert "✓ Slack webhook URL is configured." in result.stdout

def test_doctor_no_league_id():
    """
    Tests that the doctor command prints a warning when the league id is not configured.
    """
    with patch("ff_tool.doctor.get_config") as mock_get_config:
        mock_get_config.return_value.db_path = "/tmp/ff_tool.db"
        mock_get_config.return_value.league_id = None
        mock_get_config.return_value.webhook_url = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        result = runner.invoke(app, ["doctor"])
        assert result.exit_code == 0
        assert "✓ DB path is writable." in result.stdout
        assert "✗ Sleeper league ID is not configured." in result.stdout
        assert "✓ Slack webhook URL is configured." in result.stdout

def test_doctor_no_webhook_url():
    """
    Tests that the doctor command prints a warning when the webhook url is not configured.
    """
    with patch("ff_tool.doctor.get_config") as mock_get_config:
        mock_get_config.return_value.db_path = "/tmp/ff_tool.db"
        mock_get_config.return_value.league_id = "12345"
        mock_get_config.return_value.webhook_url = None
        result = runner.invoke(app, ["doctor"])
        assert result.exit_code == 0
        assert "✓ DB path is writable." in result.stdout
        assert "✓ Sleeper league ID is configured." in result.stdout
        assert "✗ Slack webhook URL is not configured." in result.stdout
