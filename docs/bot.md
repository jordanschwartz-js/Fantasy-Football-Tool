# Waiver Wire Bot

The waiver wire bot can be used to automatically send waiver wire recommendations to a Slack channel.

## Setup

1.  Create a Slack App and a webhook URL.
2.  Set the `webhook_url` in your `ff_tool.toml` file.
3.  Set the `league_id`, `current_week`, and `faab_budget` in your `ff_tool.toml` file.
4.  (Optional) Configure the `post_day` and `post_hour` in your `ff_tool.toml` file.

## Usage

To run the bot, use the `bot` command:

```bash
poetry run ff-tool bot
```
