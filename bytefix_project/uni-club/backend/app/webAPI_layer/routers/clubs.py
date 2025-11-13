from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_admin
from app.webAPI_layer.schemas import ClubPublic

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

    # ClubPublic şemasına map edelim
    return ClubPublic(
        id=club.kulup_id,
        name=club.name,
        description=club.description,
        email=club.email,
        phone=club.phone,
        admin_id=club.admin_id,
    )
