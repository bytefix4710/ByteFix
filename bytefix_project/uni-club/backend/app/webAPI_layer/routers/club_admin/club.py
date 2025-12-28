from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_admin
from app.webAPI_layer.schemas.club_admin import ClubPublic, ClubUpdate

router = APIRouter(prefix="/club-admin", tags=["club-admin-club"])


@router.get("/club/me", response_model=ClubPublic)
def get_my_club(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Bu admin'e bağlı kulüp bulunamadı.")

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
        mission=club.mission,
        vision=club.vision,
    )


@router.put("/club/me", response_model=ClubPublic)
def update_my_club(payload: ClubUpdate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    if payload.name: club.name = payload.name
    if payload.description: club.description = payload.description
    if payload.email: club.email = payload.email
    if payload.phone: club.phone = payload.phone
    if payload.mission: club.mission = payload.mission
    if payload.vision: club.vision = payload.vision

    db.commit()
    db.refresh(club)

    # ✅ GET ile aynı şekilde map et
    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
        mission=club.mission,
        vision=club.vision,
    )
