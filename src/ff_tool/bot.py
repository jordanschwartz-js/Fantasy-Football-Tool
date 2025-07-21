from slack_sdk.webhook import WebhookClient
from apscheduler.schedulers.blocking import BlockingScheduler
from .config import get_config
from .waiver import recommend_waivers


def send_waiver_recommendations() -> None:
    """
    Sends waiver wire recommendations to a Slack webhook.
    """
    config = get_config()
    if not config.webhook_url or not config.league_id:
        return
    webhook = WebhookClient(config.webhook_url)
    recommendations = recommend_waivers(
        league_id=config.league_id,
        week=config.current_week or 1,
        budget=config.faab_budget or 100,
    )
    text = "Waiver Wire Recommendations:\n"
    for rec in recommendations:
        text += f"- {rec['player_name']} ({rec['position']}, {rec['team']}): Score={rec['score']:.2f}, Bid=${rec['bid']}\n"
    response = webhook.send(text=text)
    assert response.status_code == 200
    assert response.body == "ok"


def run_bot() -> None:
    """
    Runs the bot scheduler.
    """
    config = get_config()
    scheduler = BlockingScheduler(timezone="America/Toronto")
    scheduler.add_job(
        send_waiver_recommendations,
        "cron",
        day_of_week=config.post_day,
        hour=config.post_hour,
    )
    scheduler.start()
