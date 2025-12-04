from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.webAPI_layer.deps import get_db, get_current_admin
from app.data_access_layer import models

router = APIRouter(
    prefix="/club-admin/members",
    tags=["club-admin-members"]
)


# -------------------------------
# 1) Kulübün bekleyen üyelik istekleri
# -------------------------------
@router.get("/requests")
def get_pending_requests(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Admin hangi kulübün yöneticisi?
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(404, "Bu admin'e ait kulüp bulunamadı.")

    requests = (
        db.query(models.Membership)
        .filter(
            models.Membership.kulup_id == club.kulup_id,
            models.Membership.status == models.STATUS_PENDING,
        )
        .all()
    )

    result = []
    for m in requests:
        result.append({
            "uyelik_id": m.uyelik_id,
            "ogrenci_no": m.member.ogrenci_no,
            "ad": m.member.first_name,
            "soyad": m.member.last_name,
            "email": m.member.email,
            "status": m.status,
        })

    return result


# -------------------------------
# 2) Kulübün tüm üyeleri
# -------------------------------
@router.get("/")
def get_all_members(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    club = db.query(models.Club).filter(models.Club.admin_id == admin.hesap_id).first()
    if not club:
        raise HTTPException(404, "Kulüp bulunamadı.")

    memberships = (
        db.query(models.Membership)
        .filter(models.Membership.kulup_id == club.kulup_id)
        .all()
    )

    result = []
    for m in memberships:
        result.append({
            "uyelik_id": m.uyelik_id,
            "ogrenci_no": m.member.ogrenci_no,
            "ad": m.member.first_name,
            "soyad": m.member.last_name,
            "email": m.member.email,
            "status": m.status,
        })

    return result


# -------------------------------
# 3) Üyeliği onaylama
# -------------------------------
@router.put("/{uyelik_id}/approve")
def approve_membership(
    uyelik_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    membership = db.query(models.Membership).filter_by(uyelik_id=uyelik_id).first()
    if not membership:
        raise HTTPException(404, "Üyelik bulunamadı.")

    # Admin gerçekten bu kulübün yöneticisi mi?
    if membership.club.admin_id != admin.hesap_id:
        raise HTTPException(403, "Bu üyeliği yönetme yetkiniz yok.")

    membership.status = models.STATUS_APPROVED
    db.commit()
    return {"message": "Üyelik onaylandı."}


# -------------------------------
# 4) Üyeliği reddetme
# -------------------------------
@router.put("/{uyelik_id}/reject")
def reject_membership(
    uyelik_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    membership = db.query(models.Membership).filter_by(uyelik_id=uyelik_id).first()
    if not membership:
        raise HTTPException(404, "Üyelik bulunamadı.")

    if membership.club.admin_id != admin.hesap_id:
        raise HTTPException(403, "Yetkiniz yok.")

    membership.status = models.STATUS_REJECTED
    db.commit()
    return {"message": "Üyelik reddedildi."}

# -------------------------------
# 5) Üyeliği tamamen sil (kulüpten atma)
# -------------------------------
@router.delete("/{uyelik_id}")
def delete_membership(
    uyelik_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    membership = db.query(models.Membership).filter_by(uyelik_id=uyelik_id).first()
    if not membership:
        raise HTTPException(404, "Üyelik bulunamadı.")

    # Bu kulübün admini mi?
    if membership.club.admin_id != admin.hesap_id:
        raise HTTPException(403, "Bu üyeliği yönetme yetkiniz yok.")

    db.delete(membership)
    db.commit()
    return {"message": "Üye kulüpten çıkarıldı."}
