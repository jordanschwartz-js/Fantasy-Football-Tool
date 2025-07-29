from pathlib import Path

from typer.testing import CliRunner

from ff_tool.cli import app
from ff_tool.schedule import _parse_cron

runner = CliRunner()

def test_schedule_add_and_list(tmp_path, monkeypatch):
    cfg_file: Path = tmp_path / "ff_tool.toml"
    monkeypatch.setenv("FF_TOOL_CONFIG", str(cfg_file))

    result_add = runner.invoke(app, ["bot", "schedule-add", "Tue 08:00"])
    assert result_add.exit_code == 0

    result_list = runner.invoke(app, ["bot", "schedule-list"])
    assert result_list.exit_code == 0
    assert "Tue 08:00" in result_list.stdout

def test_parse_cron_valid():
    assert _parse_cron("Tue 08:00") == {"day_of_week": "tue", "hour": 8, "minute": 0}
