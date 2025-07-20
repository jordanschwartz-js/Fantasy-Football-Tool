# Fantasy Football Tool

A toolkit for fantasy football.

## Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/fantasy-football-tool.git
    ```
2.  Install dependencies using Poetry:
    ```bash
    poetry install
    ```
    The tool uses `pulp` for optimization and `requests-cache` for caching, which may have system-level dependencies. Please see their documentation for installation instructions.

## Usage

### Scraper

To scrape weekly projections from FantasyPros:
```bash
poetry run ff-tool scraper --week 1 --scoring ppr
```

### Sleeper Sync

To sync your league data from Sleeper:
```bash
poetry run ff-tool sleeper-sync --league-id YOUR_LEAGUE_ID
```

### Viewing the database

The data is stored in a SQLite database file named `fantasy_football.db`. You can use a tool like `sqlite3` or a graphical client to view the data.
```bash
sqlite3 fantasy_football.db
```

### Network Design

The `ff_tool.net` module uses a cached session to avoid hitting the network for repeated requests. However, the scraper in `ff_tool.scraper` intentionally uses a direct `requests.get` call to allow for easier mocking in unit tests. This ensures that the tests can run without hitting the network.

### Trade Analyzer

To analyze a trade, use the `trade` command. You can provide comma-separated lists of player names for what you are sending and what you are getting.

```bash
poetry run ff-tool trade "Player A,Player B" --for "Player C,Player D"
```

### Waiver-Wire Recommender

To get waiver-wire recommendations, use the `waiver` command.

```bash
poetry run ff-tool waiver --week 4 --budget 100 --league-id YOUR_LEAGUE_ID
```