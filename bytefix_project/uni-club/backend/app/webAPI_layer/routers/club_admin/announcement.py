from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.webAPI_layer.deps import get_db, get_current_admin
from app.data_access_layer import models
from app.webAPI_layer.schemas.club_admin import AnnouncementCreate, AnnouncementPublic

router = APIRouter(prefix="/club-admin/announcements", tags=["club-admin-announcements"])


def _get_admin_club(admin: models.ClubAdmin, db: Session) -> models.Club:
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Bu admin'e ait kulüp bulunamadı.")
    return club


@router.get("", response_model=list[AnnouncementPublic])
def list_announcements(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    club = _get_admin_club(admin, db)
    anns = (
        db.query(models.Announcement)
        .filter(models.Announcement.kulup_id == club.kulup_id)
        .order_by(models.Announcement.duyuru_id.desc())
        .all()
    )
    return anns


@router.post("", response_model=AnnouncementPublic)
def create_announcement(
    payload: AnnouncementCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    club = _get_admin_club(admin, db)

    desc = (payload.description or "").strip()
    if len(desc) < 3:
        raise HTTPException(status_code=400, detail="Duyuru açıklaması çok kısa.")

    ann = models.Announcement(
        kulup_id=club.kulup_id,
        description=desc,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/{duyuru_id}")
def delete_announcement(
    duyuru_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    club = _get_admin_club(admin, db)

    ann = db.query(models.Announcement).filter(models.Announcement.duyuru_id == duyuru_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Duyuru bulunamadı.")

    if ann.kulup_id != club.kulup_id:
        raise HTTPException(status_code=403, detail="Bu duyuruyu silme yetkiniz yok.")

    db.delete(ann)
    db.commit()
    return {"message": "Duyuru silindi."}
