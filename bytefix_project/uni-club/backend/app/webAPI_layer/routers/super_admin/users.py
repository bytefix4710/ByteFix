from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.data_access_layer import models
from app.webAPI_layer.deps import get_db, get_current_super_admin
from app.webAPI_layer.schemas.super_admin import UserPublic

router = APIRouter(prefix="/super-admin", tags=["super-admin-users"])


@router.get("/users", response_model=List[UserPublic])
def get_all_users(super_admin=Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """
    Tüm sistem kullanıcılarını getirir (üyeler ve kulüp yöneticileri).
    """
    result = []
    
    # Tüm üyeleri getir
    members = db.query(models.Member).all()
    for member in members:
        # Bu üyenin hangi kulüplerde üyeliği var?
        memberships = db.query(models.Membership).filter(
            models.Membership.ogrenci_id == member.ogrenci_no
        ).all()
        
        # Eğer üyelik yoksa, sadece üye bilgisini ekle
        if not memberships:
            result.append(UserPublic(
                user_type="member",
                id=member.ogrenci_no,
                email=member.email,
                first_name=member.first_name,
                last_name=member.last_name,
                club_id=None,
                club_name=None,
            ))
        else:
            # Her kulüp için ayrı kayıt oluştur
            for membership in memberships:
                club = db.query(models.Club).filter(
                    models.Club.kulup_id == membership.kulup_id
                ).first()
                result.append(UserPublic(
                    user_type="member",
                    id=member.ogrenci_no,
                    email=member.email,
                    first_name=member.first_name,
                    last_name=member.last_name,
                    club_id=club.kulup_id if club else None,
                    club_name=club.name if club else None,
                ))
    
    # Tüm kulüp yöneticilerini getir
    admins = db.query(models.ClubAdmin).all()
    for admin in admins:
        # Bu admin hangi kulüpleri yönetiyor?
        clubs = db.query(models.Club).filter(
            models.Club.admin_id == admin.hesap_id
        ).all()
        
        # Eğer kulüp yoksa, sadece admin bilgisini ekle
        if not clubs:
            result.append(UserPublic(
                user_type="admin",
                id=str(admin.hesap_id),
                email=admin.email,
                first_name=None,
                last_name=None,
                club_id=None,
                club_name=None,
            ))
        else:
            # Her kulüp için ayrı kayıt oluştur
            for club in clubs:
                result.append(UserPublic(
                    user_type="admin",
                    id=str(admin.hesap_id),
                    email=admin.email,
                    first_name=None,
                    last_name=None,
                    club_id=club.kulup_id,
                    club_name=club.name,
                ))
    
    return result

