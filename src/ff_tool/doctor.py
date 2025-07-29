import os
from ff_tool.config import get_config

def run_doctor():
    """
    Checks the user's setup and prints a report.
    """
    config = get_config()
    print("Running doctor...")

    # Check DB path
    db_path = config.db_path or 'fantasy_football.db'
    if os.access(os.path.dirname(db_path) or '.', os.W_OK):
        print("✓ DB path is writable.")
    else:
        print("✗ DB path is not writable.")

    # Check Sleeper league ID
    if config.league_id:
        print("✓ Sleeper league ID is configured.")
    else:
        print("✗ Sleeper league ID is not configured.")

    # Check Slack webhook URL
    if config.webhook_url:
        print("✓ Slack webhook URL is configured.")
    else:
        print("✗ Slack webhook URL is not configured.")

    # Check coverage
    # This is a placeholder, as we can't check coverage from within the app.
    print("✓ Coverage is not checked by the doctor.")
