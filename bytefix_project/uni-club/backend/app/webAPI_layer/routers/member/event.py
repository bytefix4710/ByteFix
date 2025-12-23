from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.data_access_layer import models
from app.webAPI_layer.routers.member.auth import get_current_member

router = APIRouter(prefix="/members", tags=["Members Event Operations"])
from app.data_access_layer.db import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/events")
def list_events_for_member(
    db: Session = Depends(get_db),
    member=Depends(get_current_member),
):
    """
    Üye için etkinlik listesi:
    - Kulüp adı da gelsin
    - Üyenin kayıtlı olup olmadığı da gelsin (registered: true/false)
    - Kontenjan dolu mu bilgisini frontend'e verelim
    """
    events = (
        db.query(models.Event)
        .join(models.Club, models.Event.kulup_id == models.Club.kulup_id)
        .order_by(models.Event.datetime.asc())
        .all()
    )

    result = []
    for ev in events:
        club = db.query(models.Club).filter(models.Club.kulup_id == ev.kulup_id).first()

        reg = (
            db.query(models.EventReg)
            .filter(
                models.EventReg.etkinlik_id == ev.etkinlik_id,
                models.EventReg.ogrenci_id == member.ogrenci_no,
            )
            .first()
        )

        # Kontenjan hesapla (capacity yoksa None gelir)
        capacity = getattr(ev, "kontenjan", None)

        approved_count = (
            db.query(models.EventReg)
            .filter(
                models.EventReg.etkinlik_id == ev.etkinlik_id,
                models.EventReg.status.in_([models.STATUS_APPROVED, models.STATUS_PENDING]),
            )
            .count()
        )

        is_full = False
        if capacity is not None:
            is_full = approved_count >= capacity

        result.append({
            "etkinlik_id": ev.etkinlik_id,
            "kulup_id": ev.kulup_id,
            "kulup_name": club.name if club else "Bilinmeyen Kulüp",
            "name": ev.name,
            "datetime": ev.datetime.isoformat(),
            "description": ev.description,
            "image_url": ev.image_url,
            "capacity": capacity,
            "registered": True if reg else False,
            "reg_status": reg.status if reg else None,
            "is_full": is_full,
        })

    return result


@router.post("/events/{event_id}/register")
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
    member=Depends(get_current_member),
):
    ev = db.query(models.Event).filter(models.Event.etkinlik_id == event_id).first()
    if not ev:
        raise HTTPException(404, "Etkinlik bulunamadı.")

    # Başlamışsa kayıt açma
    if ev.datetime <= datetime.now():
        raise HTTPException(400, "Bu etkinlik başladı veya geçti.")

    # Zaten kayıt var mı?
    existing = (
        db.query(models.EventReg)
        .filter(
            models.EventReg.etkinlik_id == event_id,
            models.EventReg.ogrenci_id == member.ogrenci_no,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Bu etkinliğe zaten kayıt oldunuz")

    # Kontenjan kontrol (capacity varsa)
    capacity = getattr(ev, "kontenjan", None)
    if capacity is not None:
        current_count = (
            db.query(models.EventReg)
            .filter(
                models.EventReg.etkinlik_id == event_id,
                models.EventReg.status.in_([models.STATUS_APPROVED, models.STATUS_PENDING]),
            )
            .count()
        )
        if current_count >= capacity:
            raise HTTPException(400, "Etkinlik kontenjanı dolmuştur")

    reg = models.EventReg(
        etkinlik_id=event_id,
        ogrenci_id=member.ogrenci_no,
        status=models.STATUS_PENDING,
    )
    db.add(reg)
    db.commit()

    return {"message": "Başarıyla kaydoldunuz"}


@router.delete("/events/{event_id}/register")
def cancel_event_registration(
    event_id: int,
    db: Session = Depends(get_db),
    member=Depends(get_current_member),
):
    reg = (
        db.query(models.EventReg)
        .filter(
            models.EventReg.etkinlik_id == event_id,
            models.EventReg.ogrenci_id == member.ogrenci_no,
        )
        .first()
    )
    if not reg:
        raise HTTPException(400, "Bu etkinlik için kayıt bulunamadı.")

    db.delete(reg)
    db.commit()
    return {"message": "Başvurunuz geri çekildi."}
