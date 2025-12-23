from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.data_access_layer import models
from app.data_access_layer.db import SessionLocal
from app.webAPI_layer.schemas.member import ClubPublic
from app.webAPI_layer.routers.member.auth import get_current_member
from datetime import datetime

router = APIRouter(prefix="/members", tags=["Members Club Operations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 1) Tüm kulüpleri listele
# =========================
@router.get("/clubs", response_model=List[ClubPublic])
def get_all_clubs_for_members(db: Session = Depends(get_db)):
    clubs = db.query(models.Club).all()
    return [
        ClubPublic(
            id=club.kulup_id,
            name=club.name,
            description=club.description,
            email=club.email,
            phone=club.phone,
            mission=club.mission,
            vision=club.vision,
        )
        for club in clubs
    ]


# =========================
# 2) Tek kulüp detayı
# =========================
@router.get("/clubs/{club_id}", response_model=ClubPublic)
def get_club_detail(club_id: int, db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        mission=club.mission,
        vision=club.vision,
    )



# =========================
# 3) Kulübe Üye Ol (başvuru oluştur)
# =========================
@router.post("/clubs/{club_id}/join")
def join_club(
    club_id: int,
    member=Depends(get_current_member),
    db: Session = Depends(get_db),
):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    membership = (
        db.query(models.Membership)
        .filter(
            models.Membership.kulup_id == club_id,
            models.Membership.ogrenci_id == member.ogrenci_no,
        )
        .first()
    )

    if membership:
        # Zaten bir kaydı var
        if membership.status == models.STATUS_PENDING:
            raise HTTPException(
                status_code=400,
                detail="Bu kulübe zaten başvuru yaptınız.",
            )
        elif membership.status == models.STATUS_APPROVED:
            raise HTTPException(
                status_code=400,
                detail="Bu kulübün üyesisiniz.",
            )
        else:
            # Reddedilmiş olabilir, yeniden başvuruya izin veriyoruz
            membership.status = models.STATUS_PENDING
    else:
        membership = models.Membership(
            kulup_id=club_id,
            ogrenci_id=member.ogrenci_no,
            status=models.STATUS_PENDING,
        )
        db.add(membership)

    db.commit()
    return {"message": "Üyelik başvurunuz başarıyla alınmıştır."}


# =========================
# 4) Üyelik başvurusunu geri çek
# =========================
@router.delete("/clubs/{club_id}/join")
def cancel_membership_request(
    club_id: int,
    member=Depends(get_current_member),
    db: Session = Depends(get_db),
):
    membership = (
        db.query(models.Membership)
        .filter(
            models.Membership.kulup_id == club_id,
            models.Membership.ogrenci_id == member.ogrenci_no,
            models.Membership.status == models.STATUS_PENDING,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=400,
            detail="Bu kulüp için bekleyen bir başvurunuz bulunmamaktadır.",
        )

    db.delete(membership)
    db.commit()
    return {"message": "Üyelik başvurunuz geri çekildi."}


# =========================
# 5) Üye olduğum / başvuruda olduğum kulüpler
# =========================
@router.get("/my/clubs")
def get_my_clubs(
    member=Depends(get_current_member),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(models.Membership)
        .join(models.Club, models.Membership.kulup_id == models.Club.kulup_id)
        .filter(models.Membership.ogrenci_id == member.ogrenci_no)
        .all()
    )

    approved = []
    pending = []

    for m in memberships:
        item = {
            "club_id": m.kulup_id,
            "name": m.club.name,
            "status": m.status,
        }
        if m.status == models.STATUS_APPROVED:
            approved.append(item)
        elif m.status == models.STATUS_PENDING:
            pending.append(item)

    return {
        "approved": approved,
        "pending": pending,
    }

@router.get("/clubs/{club_id}/events")
def get_club_events(club_id: int, db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(404, "Kulüp bulunamadı.")

    now = datetime.now()

    upcoming = (
        db.query(models.Event)
        .filter(models.Event.kulup_id == club_id, models.Event.datetime > now)
        .order_by(models.Event.datetime.asc())
        .all()
    )

    past = (
        db.query(models.Event)
        .filter(models.Event.kulup_id == club_id, models.Event.datetime <= now)
        .order_by(models.Event.datetime.desc())
        .all()
    )

    def to_dict(ev: models.Event):
        return {
            "etkinlik_id": ev.etkinlik_id,
            "name": ev.name,
            "datetime": ev.datetime.isoformat(),
            "description": ev.description,
            "image_url": ev.image_url,
        }

    return {
        "upcoming": [to_dict(e) for e in upcoming],
        "past": [to_dict(e) for e in past],
    }