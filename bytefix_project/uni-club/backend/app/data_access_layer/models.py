from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from .db import Base
import enum

class Club(Base):
    __tablename__ = "clubs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    # yeni: kulüp-üyelik ilişkisi
    memberships = relationship("Membership", back_populates="club", cascade="all, delete-orphan")

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

# === YENİ: Kimlik ve Roller ===
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    is_active = Column(Boolean, default=True)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

class RoleEnum(str, enum.Enum):
    admin = "admin"
    member = "member"

class Membership(Base):
    __tablename__ = "memberships"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member, nullable=False)

    user = relationship("User", back_populates="memberships")
    club = relationship("Club", back_populates="memberships")

# === YENİ: Etkinlikler ===
class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    location = Column(String(200), default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_published = Column(Boolean, default=False)

    club = relationship("Club")
