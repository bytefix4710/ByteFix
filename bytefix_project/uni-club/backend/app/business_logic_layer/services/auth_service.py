from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# PROD'da .env'den okuyun
JWT_SECRET = "change_me_in_prod"
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)
