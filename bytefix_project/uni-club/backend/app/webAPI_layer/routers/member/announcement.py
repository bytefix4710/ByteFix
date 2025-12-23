from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.webAPI_layer.deps import get_db
from app.webAPI_layer.routers.member.auth import get_current_member
from app.data_access_layer import models

router = APIRouter(prefix="/members", tags=["Members Announcement Operations"])


@router.get("/announcements")
def list_announcements_for_member(
    db: Session = Depends(get_db),
    member=Depends(get_current_member),
):
    rows = (
        db.query(models.Announcement, models.Club.name)   # ✅ club name’i direkt al
        .join(models.Club, models.Announcement.kulup_id == models.Club.kulup_id)
        .order_by(models.Announcement.created_at.desc())
        .limit(10)
        .all()
    )

    result = []
    for a, club_name in rows:
        result.append(
            {
                "duyuru_id": a.duyuru_id,
                "kulup_id": a.kulup_id,
                "kulup_name": club_name,  # ✅ garanti
                "title": a.title,
                "description": a.description,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
        )
    return result
