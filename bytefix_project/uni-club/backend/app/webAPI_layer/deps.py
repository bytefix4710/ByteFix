from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.data_access_layer.db import SessionLocal
from app.data_access_layer import models
from app.business_logic_layer.services.club_admin.auth_service import JWT_SECRET, JWT_ALG

# Kulüp admini login endpoint'i
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="club-admin/login")

# Süper admin login endpoint'i
oauth2_scheme_super = OAuth2PasswordBearer(tokenUrl="super-admin/login")


def get_db():
  db = SessionLocal()
  try:
      yield db
  finally:
      db.close()


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.ClubAdmin:
  cred_exc = HTTPException(status_code=401, detail="Kimlik doğrulama gerekli")

  try:
      payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
      hesap_id = payload.get("sub")
      if hesap_id is None:
          raise cred_exc
  except JWTError:
      raise cred_exc

  admin = db.query(models.ClubAdmin).get(int(hesap_id))
  if not admin:
      raise cred_exc

  return admin


def get_current_super_admin(
    token: str = Depends(oauth2_scheme_super),
    db: Session = Depends(get_db),
) -> models.SuperAdmin:
  cred_exc = HTTPException(status_code=401, detail="Kimlik doğrulama gerekli")

  try:
      payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
      email = payload.get("sub")
      token_type = payload.get("type")
      if email is None or token_type != "super_admin":
          raise cred_exc
  except JWTError:
      raise cred_exc

  super_admin = db.query(models.SuperAdmin).filter(models.SuperAdmin.email == email).first()
  if not super_admin:
      raise cred_exc

  return super_admin
