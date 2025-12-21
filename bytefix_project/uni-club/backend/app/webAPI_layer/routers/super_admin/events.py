from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_super_admin
from app.webAPI_layer.schemas.super_admin import EventPublic

router = APIRouter(prefix="/super-admin", tags=["super-admin-events"])


@router.get("/events", response_model=List[EventPublic])
def get_all_events(super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """
    Tüm kulüplerin etkinliklerini getirir.
    """
    events = (
        db.query(models.Event)
        .join(models.Club, models.Event.kulup_id == models.Club.kulup_id)
        .order_by(models.Event.datetime.asc())
        .all()
    )
    
    result = []
    for event in events:
        club = db.query(models.Club).filter(models.Club.kulup_id == event.kulup_id).first()
        result.append(EventPublic(
            etkinlik_id=event.etkinlik_id,
            kulup_id=event.kulup_id,
            kulup_name=club.name if club else "Bilinmeyen Kulüp",
            name=event.name,
            datetime=event.datetime.isoformat(),
            description=event.description,
            image_url=event.image_url,
        ))
    
    return result

