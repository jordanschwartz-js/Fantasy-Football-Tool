import subprocess
import tempfile
from pathlib import Path


def test_e2e() -> None:
    """Run end-to-end tests for the CLI."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "fantasy_football.db"
        config_path = Path(tmpdir) / "ff_tool.toml"
        config_path.write_text(
            f"""
            [tool.poetry]
            db_path = "{db_path}"
            """
        )

        # Test scraper
        result = subprocess.run(
            ["poetry", "run", "ff-tool", "--config", str(config_path), "scraper", "1"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Successfully scraped week 1" in result.stdout

        # Test trade
        result = subprocess.run(
            [
                "poetry",
                "run",
                "ff-tool",
                "--config",
                str(config_path),
                "trade",
                "Player A",
                "--for",
                "Player B",
            ],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Trade Analysis" in result.stdout

        # Test waiver
        result = subprocess.run(
            [
                "poetry",
                "run",
                "ff-tool",
                "--config",
                str(config_path),
                "waiver",
                "1",
                "100",
                "--league-id",
                "123",
            ],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Waiver Wire Recommendations" in result.stdout
