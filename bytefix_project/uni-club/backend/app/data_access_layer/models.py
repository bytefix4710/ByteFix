from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from .db import Base

# =============== STATUS SABİTLERİ ===============
STATUS_PENDING = "beklemede"
STATUS_APPROVED = "onaylandı"
STATUS_REJECTED = "reddedildi"


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
#   + misyon, vizyon, resim
class Club(Base):
    __tablename__ = "club"

    kulup_id = Column("kulupId", Integer, primary_key=True, index=True, autoincrement=True)
    name = Column("ad", String(150), nullable=False)
    admin_id = Column("admin", Integer, ForeignKey("club_admin.hesapId"), nullable=True)
    email = Column("email", String(255), nullable=True)
    phone = Column("telefon", String(50), nullable=True)
    description = Column("aciklama", String(500), nullable=True)

    # --- yeni alanlar ---
    mission = Column("misyon", Text, nullable=True)
    vision = Column("vizyon", Text, nullable=True)
    image_url = Column("resim", String(500), nullable=True)  # dosya adı / URL

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

    announcements = relationship(
    "Announcement",
    back_populates="club",
    cascade="all, delete-orphan",
    )



# =============== MEMBERSHIP TABLOSU ===============
# membership:
#   uyelikId (PK), kulupId (FK -> club.kulupId),
#   ogrenciId (FK -> member.ogrenci_no)
#   + status (beklemede / onaylandı / reddedildi)
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
    status = Column(
        "status",
        String(20),
        nullable=False,
        default=STATUS_PENDING,
    )

    club = relationship("Club", back_populates="memberships")
    member = relationship("Member", back_populates="memberships")


# =============== EVENT TABLOSU ===============
# event:
#   etkinlikId (PK), kulupId (FK -> club.kulupId),
#   ad, tarih, açıklama, fotoğraf
class Event(Base):
    __tablename__ = "event"

    etkinlik_id = Column("etkinlikId", Integer, primary_key=True, index=True, autoincrement=True)
    kulup_id = Column("kulupId", Integer, ForeignKey("club.kulupId"), nullable=False)
    name = Column("ad", String(200), nullable=False)
    datetime = Column("tarih", DateTime, nullable=False)
    description = Column("aciklama", Text, nullable=True)
    image_url = Column("foto", String(500), nullable=True)

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
#   + status (beklemede / onaylandı / reddedildi)
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
    status = Column(
        "status",
        String(20),
        nullable=False,
        default=STATUS_PENDING,
    )

    event = relationship("Event", back_populates="registrations")
    member = relationship("Member", back_populates="event_regs")

# =============== ANNOUNCEMENT (DUYURU) TABLOSU ===============
# announcement:
#   duyuruId (PK), kulupId (FK -> club.kulupId), aciklama, tarih
class Announcement(Base):
    __tablename__ = "announcement"

    duyuru_id = Column("duyuruId", Integer, primary_key=True, index=True, autoincrement=True)

    kulup_id = Column("kulupId", Integer, ForeignKey("club.kulupId"), nullable=False)

    title = Column("baslik", String(200), nullable=False)
    description = Column("aciklama", Text, nullable=False)

    created_at = Column("tarih", DateTime, nullable=False, server_default=func.now())

    club = relationship("Club", back_populates="announcements")

