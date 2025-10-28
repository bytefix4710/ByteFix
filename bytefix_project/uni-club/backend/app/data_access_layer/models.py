from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"))

    club = relationship("Club")

class Gelistirme(Base):
    __tablename__ = "gelistirme_asamasi"
    id = Column(Integer, primary_key=True)
    description = Column(String, nullable=True)