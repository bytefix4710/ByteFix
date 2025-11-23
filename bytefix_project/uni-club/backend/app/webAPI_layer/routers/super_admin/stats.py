from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_super_admin
from app.webAPI_layer.schemas.super_admin import StatsResponse

router = APIRouter(prefix="/super-admin", tags=["super-admin-stats"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    total_clubs = db.query(models.Club).count()
    total_members = db.query(models.Member).count()
    total_events = db.query(models.Event).count()
    
    return StatsResponse(
        total_clubs=total_clubs,
        total_members=total_members,
        total_announcements=0,  # Yakında eklenecek
        total_events=total_events,
    )

