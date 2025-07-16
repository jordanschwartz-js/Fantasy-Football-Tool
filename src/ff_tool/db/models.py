from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

Base = declarative_base()

class WeeklyRanking(Base):
    __tablename__ = 'weekly_rankings'

    id = Column(Integer, primary_key=True)
    week = Column(Integer, nullable=False)
    scoring = Column(String, nullable=False)
    position = Column(String, nullable=False)
    player_name = Column(String, nullable=False)
    team = Column(String, nullable=False)
    projection = Column(Float, nullable=False)

    def __repr__(self):
        return f"<WeeklyRanking(week={self.week}, scoring='{self.scoring}', position='{self.position}', player_name='{self.player_name}', projection={self.projection})>"

class League(Base):
    __tablename__ = 'leagues'
    id = Column(Integer, primary_key=True)
    league_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    rosters = relationship("Roster", back_populates="league")

class Roster(Base):
    __tablename__ = 'rosters'
    id = Column(Integer, primary_key=True)
    roster_id = Column(Integer, nullable=False)
    owner_id = Column(String, nullable=False)
    league_id = Column(String, ForeignKey('leagues.league_id'))
    league = relationship("League", back_populates="rosters")
    players = relationship("Player", back_populates="roster")


class Player(Base):
    __tablename__ = 'players'
    id = Column(Integer, primary_key=True)
    player_id = Column(String, nullable=False)
    roster_id = Column(Integer, ForeignKey('rosters.id'))
    roster = relationship("Roster", back_populates="players")


def get_session(db_path='fantasy_football.db'):
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    DBSession = sessionmaker(bind=engine)
    return DBSession()
