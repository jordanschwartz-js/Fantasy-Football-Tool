import tempfile
from unittest.mock import patch

from typer.testing import CliRunner

from src.ff_tool.cli import app

runner = CliRunner()


def test_bot_schedule() -> None:
    """Test scheduling the bot."""
    with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
        tmp.write("")
        tmp.flush()
        with patch("toml.dump") as mock_toml_dump:
            result = runner.invoke(app, ["--config", tmp.name, "bot", "schedule", "Tue 08:00"])
            assert result.exit_code == 0
            assert "Scheduled the bot to run every Tue at 08:00" in result.stdout
            mock_toml_dump.assert_called_once()
