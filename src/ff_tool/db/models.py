from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session, Mapped

from typing import Any

Base: Any = declarative_base()

class Player(Base): # type: ignore
    __tablename__ = 'players'
    id = Column(Integer, primary_key=True)
    player_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    team = Column(String, nullable=False)

    def __repr__(self) -> str:
        return f"<Player(name='{self.name}', position='{self.position}', team='{self.team}')>"

class Ranking(Base): # type: ignore
    __tablename__ = 'rankings'
    id = Column(Integer, primary_key=True)
    player_id = Column(String, ForeignKey('players.player_id'), nullable=False)
    week = Column(Integer, nullable=False)
    scoring_format = Column(String, nullable=False)
    projected_points = Column(Float, nullable=False)
    player: Mapped["Player"] = relationship("Player")

    def __repr__(self) -> str:
        return f"<Ranking(player_id='{self.player_id}', week={self.week}, projected_points={self.projected_points})>"

class Roster(Base): # type: ignore
    __tablename__ = 'rosters'
    id = Column(Integer, primary_key=True)
    league_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    player_id = Column(String, ForeignKey('players.player_id'), nullable=False)
    player: Mapped["Player"] = relationship("Player")

    def __repr__(self) -> str:
        return f"<Roster(league_id='{self.league_id}', user_id='{self.user_id}', player_id='{self.player_id}')>"

class Matchup(Base): # type: ignore
    __tablename__ = 'matchups'
    id = Column(Integer, primary_key=True)
    week = Column(Integer, nullable=False)
    league_id = Column(String, nullable=False)
    roster_id_1 = Column(Integer, ForeignKey('rosters.id'), nullable=False)
    roster_id_2 = Column(Integer, ForeignKey('rosters.id'), nullable=False)
    roster_1: Mapped["Roster"] = relationship("Roster", foreign_keys=[roster_id_1])
    roster_2: Mapped["Roster"] = relationship("Roster", foreign_keys=[roster_id_2])

    def __repr__(self) -> str:
        return f"<Matchup(week={self.week}, league_id='{self.league_id}')>"


def get_session(db_path: str = 'fantasy_football.db') -> Session:
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    DBSession = sessionmaker(bind=engine)
    return DBSession()
