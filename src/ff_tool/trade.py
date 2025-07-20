"""
Trade analyzer module.

This module provides functions for analyzing fantasy football trades.
"""
from typing import Dict, List, Any

from sqlalchemy.orm import Session

from .db.models import Player, Ranking, get_session


def get_ros_projected_points(session: Session, player_id: str) -> float:
    """
    Calculates the rest-of-season projected points for a player.

    Args:
        session: The database session.
        player_id: The ID of the player.

    Returns:
        The sum of the player's projected points for all weeks in the database.
    """
    rankings = session.query(Ranking).filter_by(player_id=player_id).all()
    # mypy is not able to infer the type of ranking.projected_points, so we ignore it.
    return sum(ranking.projected_points for ranking in rankings if ranking.projected_points is not None)  # type: ignore


def analyze_trade(
    assets_out: List[str], assets_in: List[str]
) -> Dict[str, Any]:
    """
    Analyzes a trade based on rest-of-season projected points.

    Args:
        assets_out: A list of player names being traded away.
        assets_in: A list of player names being acquired.

    Returns:
        A dictionary containing the trade analysis, including the total
        projected points for each side of the trade, the point differential,
        the percentage change in points, and a recommendation.
    """
    session = get_session()

    points_out = 0.0
    for player_name_out in assets_out:
        player_out = session.query(Player).filter_by(name=player_name_out).first()
        if player_out:
            points_out += get_ros_projected_points(session, str(player_out.player_id))

    points_in = 0.0
    for player_name_in in assets_in:
        player_in = session.query(Player).filter_by(name=player_name_in).first()
        if player_in:
            points_in += get_ros_projected_points(session, str(player_in.player_id))

    delta = points_in - points_out
    percentage_change = (delta / points_out) * 100 if points_out > 0 else 0

    recommendation = "Accept" if delta > 0 else "Decline"

    session.close()

    return {
        "assets_out": {"players": assets_out, "total_points": points_out},
        "assets_in": {"players": assets_in, "total_points": points_in},
        "delta": delta,
        "percentage_change": percentage_change,
        "recommendation": recommendation,
    }
