from .db.models import get_session, Roster, Player
from sqlalchemy.orm import Session
from typing import Any, Dict, List
from ff_tool.net import get

class Sleeper:
    def __init__(self, league_id: str):
        self.league_id = league_id
        self.session: Session = get_session()

    def get_league(self) -> Dict[str, Any]:
        url = f"https://api.sleeper.app/v1/league/{self.league_id}"
        response = get(url)
        return response.json()

    def get_rosters(self) -> List[Dict[str, Any]]:
        url = f"https://api.sleeper.app/v1/league/{self.league_id}/rosters"
        try:
            response = get(url)
            data = response.json()
            return data if data else []
        except Exception:
            return []

    def sync_league(self) -> None:
        rosters_data = self.get_rosters()

        for roster_data in rosters_data:
            owner_id = roster_data.get("owner_id")
            if not owner_id:
                continue

            for player_id in roster_data.get("players", []):
                player = self.session.query(Player).filter_by(player_id=player_id).first()
                if not player:
                    player = Player(
                        player_id=player_id,
                        name="Unknown",
                        position="Unknown",
                        team="Unknown"
                    )
                    self.session.add(player)

                roster = Roster(
                    league_id=self.league_id,
                    user_id=owner_id,
                    player_id=player_id,
                )
                self.session.add(roster)
        self.session.commit()
        self.session.close()
