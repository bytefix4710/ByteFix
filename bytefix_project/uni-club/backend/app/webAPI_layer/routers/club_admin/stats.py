from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.webAPI_layer.deps import get_db, get_current_admin
from app.data_access_layer import models

router = APIRouter(
    prefix="/club-admin",
    tags=["club-admin-stats"],
)

@router.get("/stats")
def get_stats(
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Bu admin hangi kulübün yöneticisi?
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(404, "Bu admin'e ait kulüp bulunamadı.")

    total_members = (
        db.query(models.Membership)
        .filter(
            models.Membership.kulup_id == club.kulup_id,
            models.Membership.status == models.STATUS_APPROVED,
        )
        .count()
    )

    total_events = (
        db.query(models.Event)
        .filter(models.Event.kulup_id == club.kulup_id)
        .count()
    )

    pending_memberships = (
        db.query(models.Membership)
        .filter(
            models.Membership.kulup_id == club.kulup_id,
            models.Membership.status == models.STATUS_PENDING,
        )
        .count()
    )

    return {
        "club_id": club.kulup_id,
        "total_members": total_members,
        "total_events": total_events,
        "pending_memberships": pending_memberships,
    }
