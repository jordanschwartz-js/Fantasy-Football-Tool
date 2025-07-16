from sqlalchemy import create_engine, ForeignKey, String, Float, Integer
from sqlalchemy.orm import sessionmaker, relationship, DeclarativeBase, Session, Mapped, mapped_column
from typing import Any, List


class Base(DeclarativeBase):
    pass


class Player(Base):
    __tablename__ = 'players'
    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[str] = mapped_column(String, nullable=False)
    team: Mapped[str] = mapped_column(String, nullable=False)

    def __repr__(self) -> str:
        return f"<Player(name='{self.name}', position='{self.position}', team='{self.team}')>"


class Ranking(Base):
    __tablename__ = 'rankings'
    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[str] = mapped_column(ForeignKey('players.player_id'), nullable=False)
    week: Mapped[int] = mapped_column(Integer, nullable=False)
    scoring_format: Mapped[str] = mapped_column(String, nullable=False)
    projected_points: Mapped[float] = mapped_column(Float, nullable=False)
    player: Mapped["Player"] = relationship()

    def __repr__(self) -> str:
        return f"<Ranking(player_id='{self.player_id}', week={self.week}, projected_points={self.projected_points})>"


class Roster(Base):
    __tablename__ = 'rosters'
    id: Mapped[int] = mapped_column(primary_key=True)
    league_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    player_id: Mapped[str] = mapped_column(ForeignKey('players.player_id'), nullable=False)
    player: Mapped["Player"] = relationship()

    def __repr__(self) -> str:
        return f"<Roster(league_id='{self.league_id}', user_id='{self.user_id}', player_id='{self.player_id}')>"


class Matchup(Base):
    __tablename__ = 'matchups'
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, nullable=False)
    league_id: Mapped[str] = mapped_column(String, nullable=False)
    roster_id_1: Mapped[int] = mapped_column(ForeignKey('rosters.id'), nullable=False)
    roster_id_2: Mapped[int] = mapped_column(ForeignKey('rosters.id'), nullable=False)
    roster_1: Mapped[List["Roster"]] = relationship(foreign_keys=[roster_id_1])
    roster_2: Mapped[List["Roster"]] = relationship(foreign_keys=[roster_id_2])

    def __repr__(self) -> str:
        return f"<Matchup(week={self.week}, league_id='{self.league_id}')>"


def get_session(db_path: str = 'fantasy_football.db') -> Session:
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    DBSession = sessionmaker(bind=engine)
    return DBSession()
