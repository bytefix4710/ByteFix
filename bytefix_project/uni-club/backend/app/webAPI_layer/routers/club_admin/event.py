from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.webAPI_layer.deps import get_db, get_current_admin
from app.data_access_layer import models
from app.webAPI_layer.schemas.club_admin import EventCreate, EventPublic

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

