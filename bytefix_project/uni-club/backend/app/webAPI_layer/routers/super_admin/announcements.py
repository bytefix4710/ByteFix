from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_super_admin
from app.webAPI_layer.schemas.super_admin import AnnouncementPublic, AnnouncementCreate

router = APIRouter(prefix="/super-admin", tags=["super-admin-announcements"])


@router.get("/announcements", response_model=List[AnnouncementPublic])
def get_all_announcements(super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """
    Tüm kulüplerin duyurularını getirir.
    """
    announcements = (
        db.query(models.Announcement)
        .order_by(models.Announcement.created_at.desc())
        .all()
    )
    
    result = []
    for ann in announcements:
        club = None
        if ann.kulup_id:
            club = db.query(models.Club).filter(models.Club.kulup_id == ann.kulup_id).first()
        
        result.append(AnnouncementPublic(
            duyuru_id=ann.duyuru_id,
            kulup_id=ann.kulup_id,
            kulup_name=club.name if club else "Sistem Geneli",
            title=ann.title,
            description=ann.description,
            created_at=ann.created_at.isoformat() if ann.created_at else "",
        ))
    
    return result


@router.post("/announcements", response_model=AnnouncementPublic)
def create_announcement(
    payload: AnnouncementCreate,
    super_admin=Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """
    Sistem geneli veya belirli bir kulüp için duyuru oluşturur.
    kulup_id None ise sistem geneli, belirtilirse o kulüp için.
    """
    # Eğer kulup_id belirtilmişse, kulübün var olduğunu kontrol et
    if payload.kulup_id:
        club = db.query(models.Club).filter(models.Club.kulup_id == payload.kulup_id).first()
        if not club:
            raise HTTPException(status_code=404, detail="Belirtilen kulüp bulunamadı.")
    
    announcement = models.Announcement(
        kulup_id=payload.kulup_id,
        title=payload.title,
        description=payload.description,
    )
    
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    # Kulüp bilgisini al
    club = None
    if announcement.kulup_id:
        club = db.query(models.Club).filter(models.Club.kulup_id == announcement.kulup_id).first()
    
    return AnnouncementPublic(
        duyuru_id=announcement.duyuru_id,
        kulup_id=announcement.kulup_id,
        kulup_name=club.name if club else "Sistem Geneli",
        title=announcement.title,
        description=announcement.description,
        created_at=announcement.created_at.isoformat() if announcement.created_at else "",
    )

