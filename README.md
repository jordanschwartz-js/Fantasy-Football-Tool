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