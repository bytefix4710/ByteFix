from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.business_logic_layer.services.auth_service import JWT_SECRET, JWT_ALG

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    cred_exc = HTTPException(status_code=401, detail="Kimlik doğrulama gerekli")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(models.User).get(int(user_id))
    if not user:
        raise cred_exc
    return user

def require_admin_of_club(club_id: int, token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        admin_clubs = payload.get("admin_clubs", [])
        if club_id not in admin_clubs:
            raise HTTPException(status_code=403, detail="Bu kulüp için yetkin yok")
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")
