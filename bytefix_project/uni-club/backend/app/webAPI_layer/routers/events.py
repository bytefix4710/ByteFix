from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.webAPI_layer.schemas import EventCreate, EventPublic
from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.webAPI_layer.deps import get_current_user, require_admin_of_club, oauth2_scheme

router = APIRouter(prefix="/events", tags=["events"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=EventPublic)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    require_admin_of_club(payload.club_id, token)
    ev = models.Event(**payload.dict())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.get("/{club_id}", response_model=list[EventPublic])
def list_events(club_id: int, db: Session = Depends(get_db)):
    return db.query(models.Event).filter_by(club_id=club_id).all()

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    ev = db.query(models.Event).get(event_id)
    if not ev:
        raise HTTPException(404, "Bulunamadı")
    require_admin_of_club(ev.club_id, token)
    db.delete(ev)
    db.commit()
    return {"ok": True}
