from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

# DB ve Modeller
from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models

# Şemalar
from app.webAPI_layer.schemas.member import MemberRegister, MemberLogin, Token, MemberProfile

# Auth Servisi ve Ayarlar
from app.business_logic_layer.services.club_admin.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET,
    JWT_ALG
)

router = APIRouter(prefix="/members", tags=["Members Auth"])

# Token'ın nerede olduğunu belirtiyoruz (Login path'i)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="members/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- TOKEN DOĞRULAMA VE KULLANICIYI BULMA (DEPENDENCY) ---
def get_current_member(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tokenı çöz
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        
        if email is None or role != "member":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # DB'den kullanıcıyı bul
    member = db.query(models.Member).filter(models.Member.email == email).first()
    if member is None:
        raise credentials_exception
        
    return member

# =============== ÜYE KAYIT (REGISTER) ===============
@router.post("/register", response_model=Token)
def register_member(payload: MemberRegister, db: Session = Depends(get_db)):
    existing_member = db.query(models.Member).filter(
        (models.Member.email == payload.email) | (models.Member.ogrenci_no == payload.ogrenci_no)
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta veya öğrenci numarası ile zaten bir kayıt var."
        )

    hashed_pwd = hash_password(payload.password)

    new_member = models.Member(
        ogrenci_no=payload.ogrenci_no,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hashed_pwd
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    access_token = create_access_token(
        data={"sub": new_member.email, "role": "member", "id": new_member.ogrenci_no}
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": "member",
        "ogrenci_no": new_member.ogrenci_no
    }

# =============== ÜYE GİRİŞ (LOGIN) ===============
@router.post("/login", response_model=Token)
def login_member(payload: MemberLogin, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.email == payload.email).first()

    if not member or not verify_password(payload.password, member.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": member.email, "role": "member", "id": member.ogrenci_no}
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": "member",
        "ogrenci_no": member.ogrenci_no
    }

# =============== PROFİLİMİ GETİR (ME) - YENİ ===============
@router.get("/me", response_model=MemberProfile)
def get_my_profile(current_member: models.Member = Depends(get_current_member)):
    # get_current_member zaten token kontrolünü yaptı ve member objesini getirdi
    return current_member