from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_super_admin
from app.webAPI_layer.schemas.super_admin import ClubPublic, ClubCreate, ClubUpdate

router = APIRouter(prefix="/super-admin", tags=["super-admin-club"])


@router.get("/clubs", response_model=List[ClubPublic])
def get_all_clubs(super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    clubs = db.query(models.Club).all()
    return [
        ClubPublic(
            id=club.kulup_id,
            name=club.name,
            description=club.description,
            email=club.email,
            phone=club.phone,
            admin_id=club.admin_id,
        )
        for club in clubs
    ]


@router.get("/clubs/{club_id}", response_model=ClubPublic)
def get_club(club_id: int, super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )


@router.post("/clubs", response_model=ClubPublic)
def create_club(payload: ClubCreate, super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    # Eğer admin_id verilmişse, o admin'in var olduğunu kontrol et
    if payload.admin_id:
        admin = db.query(models.ClubAdmin).filter(models.ClubAdmin.hesap_id == payload.admin_id).first()
        if not admin:
            raise HTTPException(status_code=400, detail="Belirtilen admin bulunamadı.")

    club = models.Club(
        name=payload.name,
        description=payload.description,
        email=payload.email,
        phone=payload.phone,
        admin_id=payload.admin_id,
    )
    db.add(club)
    db.commit()
    db.refresh(club)

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )


@router.put("/clubs/{club_id}", response_model=ClubPublic)
def update_club(club_id: int, payload: ClubUpdate, super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    # Eğer admin_id güncelleniyorsa, o admin'in var olduğunu kontrol et
    if payload.admin_id is not None:
        admin = db.query(models.ClubAdmin).filter(models.ClubAdmin.hesap_id == payload.admin_id).first()
        if not admin:
            raise HTTPException(status_code=400, detail="Belirtilen admin bulunamadı.")

    if payload.name is not None:
        club.name = payload.name
    if payload.description is not None:
        club.description = payload.description
    if payload.email is not None:
        club.email = payload.email
    if payload.phone is not None:
        club.phone = payload.phone
    if payload.admin_id is not None:
        club.admin_id = payload.admin_id

    db.commit()
    db.refresh(club)

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )


@router.delete("/clubs/{club_id}")
def delete_club(club_id: int, super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    club = db.query(models.Club).filter(models.Club.kulup_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Kulüp bulunamadı.")

    db.delete(club)
    db.commit()
    return {"message": "Kulüp başarıyla silindi."}

