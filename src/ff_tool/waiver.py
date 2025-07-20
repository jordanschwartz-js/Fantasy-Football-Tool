"""
Waiver wire recommender module.

This module provides functions for recommending waiver wire pickups.
"""
from typing import List, Dict, Any

from .sleeper import Sleeper
from .db.models import Player, get_session
from .trade import get_ros_projected_points


def get_free_agents(league_id: str) -> List[Player]:
    """
    Gets a list of free agents from the Sleeper API.

    Args:
        league_id: The ID of the Sleeper league.

    Returns:
        A list of Player objects representing the free agents.
    """
    session = get_session()
    sleeper = Sleeper(league_id)
    rosters = sleeper.get_rosters()
    rostered_player_ids = {
        player_id for roster in rosters for player_id in roster.get("players", [])
    }

    all_players = session.query(Player).all()
    free_agents = [
        player
        for player in all_players
        if player.player_id not in rostered_player_ids
    ]
    session.close()
    return free_agents


def recommend_waivers(
    league_id: str, week: int, budget: int
) -> List[Dict[str, Any]]:
    """
    Recommends waiver wire pickups based on rest-of-season projected points
    and positional scarcity.

    Args:
        league_id: The ID of the Sleeper league.
        week: The current week.
        budget: The remaining FAAB budget.

    Returns:
        A list of dictionaries, where each dictionary represents a recommended
        waiver wire pickup and contains the player's name, position, team,
        projected points gain, and a recommended FAAB bid.
    """
    session = get_session()
    free_agents = get_free_agents(league_id)
    recommendations = []

    for player in free_agents:
        ros_points = get_ros_projected_points(session, str(player.player_id))
        # TODO: Implement scoring logic based on positional scarcity.
        score = ros_points
        # TODO: Implement FAAB bid logic.
        bid = 0

        recommendations.append(
            {
                "player_name": player.name,
                "position": player.position,
                "team": player.team,
                "score": score,
                "bid": bid,
            }
        )

    recommendations.sort(key=lambda x: x["score"], reverse=True)  # type: ignore
    session.close()
    return recommendations
