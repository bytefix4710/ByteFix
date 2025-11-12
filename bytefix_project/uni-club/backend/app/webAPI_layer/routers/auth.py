from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.webAPI_layer.schemas import UserRegister, UserPublic, Token
from app.business_logic_layer.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserPublic)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(status_code=400, detail="Email zaten kayıtlı")
    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

class LoginReq(UserRegister):
    pass

@router.post("/login", response_model=Token)
def login(payload: LoginReq, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz bilgiler")
    admin_clubs = [m.club_id for m in user.memberships if m.role.value == "admin"]
    token = create_access_token({"sub": str(user.id), "admin_clubs": admin_clubs})
    return {"access_token": token, "token_type": "bearer"}
