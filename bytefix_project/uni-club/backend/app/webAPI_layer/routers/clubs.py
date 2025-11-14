from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_admin
from app.webAPI_layer.schemas import ClubPublic, ClubUpdate

router = APIRouter(tags=["clubs"])


@router.get("/gelistirme")
def get_gelistirme():
    # Artık ayrı bir Gelistirme tablosu yok, sabit mesaj döndürüyoruz
    return {"description": "Bu site geliştirme aşamasındadır."}


@router.get("/clubs/me", response_model=ClubPublic)
def get_my_club(
    admin=Depends(get_current_admin),
    database: Session = Depends(get_db),
):
    """
    Token içindeki hesap_id (sub) ile, club tablosundaki admin sütunu
    eşleşen kulübü getirir.
    """
    club = (
        database.query(models.Club)
        .filter(models.Club.admin_id == admin.hesap_id)
        .first()
    )
    if not club:
        raise HTTPException(
            status_code=404, detail="Bu admin'e ait kayıtlı kulüp bulunamadı."
        )

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )


@router.put("/clubs/me", response_model=ClubPublic)
def update_my_club(
    payload: ClubUpdate,
    admin=Depends(get_current_admin),
    database: Session = Depends(get_db),
):
    """
    Giriş yapmış kulüp admininin kulübünü günceller.
    (Sadece kendisine ait kulüpte değişiklik yapabilir.)
    """
    club = (
        database.query(models.Club)
        .filter(models.Club.admin_id == admin.hesap_id)
        .first()
    )
    if not club:
        raise HTTPException(
            status_code=404, detail="Bu admin'e ait kayıtlı kulüp bulunamadı."
        )

    # Gönderilen alanları güncelle (None gelenler değişmez)
    if payload.name is not None:
        club.name = payload.name
    if payload.description is not None:
        club.description = payload.description
    if payload.email is not None:
        club.email = payload.email
    if payload.phone is not None:
        club.phone = payload.phone

    database.commit()
    database.refresh(club)

    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )
