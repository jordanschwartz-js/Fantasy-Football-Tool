import requests
from .db.models import get_session, League, Roster, Player

class Sleeper:
    def __init__(self, league_id: str):
        self.league_id = league_id
        self.session = get_session()

    def get_league(self):
        url = f"https://api.sleeper.app/v1/league/{self.league_id}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def get_rosters(self):
        url = f"https://api.sleeper.app/v1/league/{self.league_id}/rosters"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def sync_league(self):
        league_data = self.get_league()
        rosters_data = self.get_rosters()

        league = self.session.query(League).filter_by(league_id=league_data["league_id"]).first()
        if not league:
            league = League(
                league_id=league_data["league_id"],
                name=league_data["name"],
            )
            self.session.add(league)

        for roster_data in rosters_data:
            owner_id = roster_data.get("owner_id")
            if not owner_id:
                continue
            roster = self.session.query(Roster).filter_by(roster_id=roster_data["roster_id"], league_id=league_data["league_id"]).first()
            if not roster:
                roster = Roster(
                    roster_id=roster_data["roster_id"],
                    owner_id=owner_id,
                    league_id=league_data["league_id"],
                )
                self.session.add(roster)

            # Clear existing players for this roster
            self.session.query(Player).filter_by(roster_id=roster.id).delete()

            if roster_data.get("players"):
                for player_id in roster_data["players"]:
                    player = Player(
                        player_id=player_id,
                        roster_id=roster.id
                    )
                    self.session.add(player)
        self.session.commit()
        self.session.close()
