from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.data_access_layer import models
from app.data_access_layer.db import SessionLocal
from app.webAPI_layer.schemas.member import ClubPublic

router = APIRouter(prefix="/members", tags=["Members Club Operations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Tüm kulüpleri listele
@router.get("/clubs", response_model=List[ClubPublic])
def get_all_clubs_for_members(db: Session = Depends(get_db)):
    clubs = db.query(models.Club).all()
    # List comprehension ile DB modelini Pydantic şemasına çeviriyoruz
    return [
        ClubPublic(
            id=club.kulup_id,
            name=club.name,
            description=club.description,
            email=club.email,
            phone=club.phone
        )
        for club in clubs
    ]

# Tek bir kulübün detayını gör
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
        phone=club.phone
    )