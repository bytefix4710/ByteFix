from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.webAPI_layer.deps import get_db, get_current_admin
from app.data_access_layer import models
from app.webAPI_layer.schemas.club_admin import EventCreate, EventUpdate, EventPublic, EventRegPublic

router = APIRouter(
    prefix="/club-admin/events",
    tags=["club-admin-events"],
)


def _get_admin_club(admin: models.ClubAdmin, db: Session) -> models.Club:
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Bu admin'e ait kulüp bulunamadı.")
    return club


# --------- ETKİNLİK LİSTELEME -----------
@router.get("/", response_model=list[EventPublic])
def list_events(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    club = _get_admin_club(admin, db)

    events = (
        db.query(models.Event)
        .filter(models.Event.kulup_id == club.kulup_id)
        .order_by(models.Event.datetime.asc())
        .all()
    )
    return events


# --------- ETKİNLİK OLUŞTURMA -----------
@router.post("/", response_model=EventPublic)
def create_event(
    payload: EventCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    club = _get_admin_club(admin, db)

    event = models.Event(
        kulup_id=club.kulup_id,
        name=payload.name,
        datetime=payload.datetime,
        description=payload.description,
        image_url=payload.image_url,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

# --------- ETKİNLİK GÜNCELLEME -----------
def _get_event_for_admin(event_id: int, admin, db: Session) -> models.Event:
    club = _get_admin_club(admin, db)
    ev = db.query(models.Event).filter(models.Event.etkinlik_id == event_id).first()
    if not ev:
        raise HTTPException(404, "Etkinlik bulunamadı.")
    if ev.kulup_id != club.kulup_id:
        raise HTTPException(403, "Bu etkinliği yönetme yetkiniz yok.")
    return ev

@router.put("/{event_id}", response_model=EventPublic)
def update_event(
    event_id: int,
    payload: EventUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)

    if payload.name is not None:
        ev.name = payload.name
    if payload.datetime is not None:
        ev.datetime = payload.datetime
    if payload.description is not None:
        ev.description = payload.description
    if payload.image_url is not None:
        ev.image_url = payload.image_url

    db.commit()
    db.refresh(ev)
    return ev

# --------- ETKİNLİK SİLME -----------
@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)
    db.delete(ev)
    db.commit()
    return {"message": "Etkinlik silindi."}

# --------- ETKİNLİK KAYITLARINI LİSTELEME -----------
@router.get("/{event_id}/registrations", response_model=list[EventRegPublic])
def list_registrations(
    event_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)

    regs = (
        db.query(models.EventReg)
        .filter(models.EventReg.etkinlik_id == ev.etkinlik_id)
        .all()
    )

    # Üye bilgilerini de ekleyelim
    result = []
    for r in regs:
        result.append({
            "kayit_id": r.kayit_id,
            "etkinlik_id": r.etkinlik_id,
            "ogrenci_id": r.ogrenci_id,
            "status": r.status,
            "first_name": r.member.first_name if r.member else None,
            "last_name": r.member.last_name if r.member else None,
            "email": r.member.email if r.member else None,
        })
    return result

# --------- ETKİNLİK KAYDI DURUM GÜNCELLEME -----------
@router.put("/{event_id}/registrations/{kayit_id}/approve")
def approve_registration(
    event_id: int,
    kayit_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)

    reg = db.query(models.EventReg).filter(models.EventReg.kayit_id == kayit_id).first()
    if not reg or reg.etkinlik_id != ev.etkinlik_id:
        raise HTTPException(404, "Kayıt bulunamadı.")

    reg.status = models.STATUS_APPROVED
    db.commit()
    return {"message": "Kayıt onaylandı."}


@router.put("/{event_id}/registrations/{kayit_id}/reject")
def reject_registration(
    event_id: int,
    kayit_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)

    reg = db.query(models.EventReg).filter(models.EventReg.kayit_id == kayit_id).first()
    if not reg or reg.etkinlik_id != ev.etkinlik_id:
        raise HTTPException(404, "Kayıt bulunamadı.")

    reg.status = models.STATUS_REJECTED
    db.commit()
    return {"message": "Kayıt reddedildi."}

@router.delete("/{event_id}/registrations/{kayit_id}")
def delete_registration(
    event_id: int,
    kayit_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ev = _get_event_for_admin(event_id, admin, db)

    reg = (
        db.query(models.EventReg)
        .filter(models.EventReg.kayit_id == kayit_id)
        .first()
    )

    if not reg or reg.etkinlik_id != ev.etkinlik_id:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı.")

    db.delete(reg)
    db.commit()

    return {"message": "Etkinlik kaydı silindi."}
