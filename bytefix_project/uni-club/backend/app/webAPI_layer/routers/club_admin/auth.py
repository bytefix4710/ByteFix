from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.webAPI_layer.schemas.club_admin import (
    ClubAdminRegister,
    ClubAdminPublic,
    Token,
)
from app.business_logic_layer.services.club_admin.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/club-admin", tags=["club-admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=ClubAdminPublic)
def register_admin(payload: ClubAdminRegister, db: Session = Depends(get_db)):
    existing = db.query(models.ClubAdmin).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta ile kayıtlı admin zaten var.")

    admin = models.ClubAdmin(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.post("/login", response_model=Token)
def login_admin(payload: ClubAdminRegister, db: Session = Depends(get_db)):
    admin = db.query(models.ClubAdmin).filter_by(email=payload.email).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz e-posta veya şifre")

    token = create_access_token({"sub": str(admin.hesap_id)})
    return {"access_token": token, "token_type": "bearer"}
