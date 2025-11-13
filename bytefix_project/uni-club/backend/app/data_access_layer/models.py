from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .db import Base


# =============== MEMBER TABLOSU ===============
# member:
#   ogrenci_no (PK), ad, soyad, eposta, sifre
class Member(Base):
    __tablename__ = "member"

    ogrenci_no = Column("ogrenci_no", String(20), primary_key=True, index=True)
    first_name = Column("ad", String(100), nullable=False)
    last_name = Column("soyad", String(100), nullable=False)
    email = Column("eposta", String(255), unique=True, nullable=False, index=True)
    password_hash = Column("sifre", String(255), nullable=False)

    memberships = relationship(
        "Membership",
        back_populates="member",
        cascade="all, delete-orphan",
    )
    event_regs = relationship(
        "EventReg",
        back_populates="member",
        cascade="all, delete-orphan",
    )


# =============== CLUB_ADMIN TABLOSU ===============
# club_admin:
#   hesapId (PK), eposta, sifre
class ClubAdmin(Base):
    __tablename__ = "club_admin"

    hesap_id = Column("hesapId", Integer, primary_key=True, index=True, autoincrement=True)
    email = Column("eposta", String(255), unique=True, nullable=False, index=True)
    password_hash = Column("sifre", String(255), nullable=False)

    clubs = relationship("Club", back_populates="admin_user")


# =============== SUPER_ADMIN TABLOSU ===============
# super_admin:
#   eposta (PK), sifre
class SuperAdmin(Base):
    __tablename__ = "super_admin"

    email = Column("eposta", String(255), primary_key=True, index=True)
    password_hash = Column("sifre", String(255), nullable=False)


# =============== CLUB TABLOSU ===============
# club:
#   kulupId (PK), ad, admin (FK -> club_admin.hesapId),
#   email, telefon, açıklama
class Club(Base):
    __tablename__ = "club"

    kulup_id = Column("kulupId", Integer, primary_key=True, index=True, autoincrement=True)
    name = Column("ad", String(150), nullable=False)
    admin_id = Column("admin", Integer, ForeignKey("club_admin.hesapId"), nullable=True)
    email = Column("email", String(255), nullable=True)
    phone = Column("telefon", String(50), nullable=True)
    description = Column("aciklama", String(500), nullable=True)

    admin_user = relationship("ClubAdmin", back_populates="clubs")

    memberships = relationship(
        "Membership",
        back_populates="club",
        cascade="all, delete-orphan",
    )
    events = relationship(
        "Event",
        back_populates="club",
        cascade="all, delete-orphan",
    )


# =============== MEMBERSHIP TABLOSU ===============
# membership:
#   uyelikId (PK), kulupId (FK -> club.kulupId),
#   ogrenciId (FK -> member.ogrenci_no)
class Membership(Base):
    __tablename__ = "membership"

    uyelik_id = Column("uyelikId", Integer, primary_key=True, index=True, autoincrement=True)
    kulup_id = Column("kulupId", Integer, ForeignKey("club.kulupId"), nullable=False)
    ogrenci_id = Column(
        "ogrenciId",
        String(20),
        ForeignKey("member.ogrenci_no"),
        nullable=False,
    )

    club = relationship("Club", back_populates="memberships")
    member = relationship("Member", back_populates="memberships")


# =============== EVENT TABLOSU ===============
# event:
#   etkinlikId (PK), kulupId (FK -> club.kulupId),
#   ad, tarih
class Event(Base):
    __tablename__ = "event"

    etkinlik_id = Column("etkinlikId", Integer, primary_key=True, index=True, autoincrement=True)
    kulup_id = Column("kulupId", Integer, ForeignKey("club.kulupId"), nullable=False)
    name = Column("ad", String(200), nullable=False)
    datetime = Column("tarih", DateTime, nullable=False)

    club = relationship("Club", back_populates="events")
    registrations = relationship(
        "EventReg",
        back_populates="event",
        cascade="all, delete-orphan",
    )


# =============== EVENT_REG TABLOSU ===============
# event_reg:
#   kayitId (PK), etkinlikId (FK -> event.etkinlikId),
#   ogrenciId (FK -> member.ogrenci_no)
class EventReg(Base):
    __tablename__ = "event_reg"

    kayit_id = Column("kayitId", Integer, primary_key=True, index=True, autoincrement=True)
    etkinlik_id = Column("etkinlikId", Integer, ForeignKey("event.etkinlikId"), nullable=False)
    ogrenci_id = Column(
        "ogrenciId",
        String(20),
        ForeignKey("member.ogrenci_no"),
        nullable=False,
    )

    event = relationship("Event", back_populates="registrations")
    member = relationship("Member", back_populates="event_regs")
