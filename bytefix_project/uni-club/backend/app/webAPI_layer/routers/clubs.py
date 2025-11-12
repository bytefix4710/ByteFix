from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.webAPI_layer.deps import get_current_user, require_admin_of_club, oauth2_scheme

router = APIRouter(prefix="/clubs", tags=["clubs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{club_id}")
def get_club(club_id: int, db: Session = Depends(get_db)):
    club = db.query(models.Club).get(club_id)
    if not club:
        raise HTTPException(404, "Kulüp yok")
    return {"id": club.id, "name": club.name, "description": club.description}

@router.put("/{club_id}")
def update_club(
    club_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    require_admin_of_club(club_id, token)
    club = db.query(models.Club).get(club_id)
    if not club:
        raise HTTPException(404, "Kulüp yok")
    club.name = payload.get("name", club.name)
    club.description = payload.get("description", club.description)
    db.commit()
    return {"ok": True}
