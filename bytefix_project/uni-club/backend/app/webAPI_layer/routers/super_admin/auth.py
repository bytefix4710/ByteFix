from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.webAPI_layer.schemas.super_admin import (
    SuperAdminRegister,
    SuperAdminPublic,
    Token,
)
from app.business_logic_layer.services.super_admin.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=SuperAdminPublic)
def register_super_admin(payload: SuperAdminRegister, db: Session = Depends(get_db)):
    existing = db.query(models.SuperAdmin).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta ile kayıtlı süper admin zaten var.")

    super_admin = models.SuperAdmin(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    return super_admin


@router.post("/login", response_model=Token)
def login_super_admin(payload: SuperAdminRegister, db: Session = Depends(get_db)):
    super_admin = db.query(models.SuperAdmin).filter_by(email=payload.email).first()
    if not super_admin or not verify_password(payload.password, super_admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz e-posta veya şifre")

    token = create_access_token({"sub": super_admin.email, "type": "super_admin"})
    return {"access_token": token, "token_type": "bearer"}

