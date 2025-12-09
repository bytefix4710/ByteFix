from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- AUTH ŞEMALARI ---

class MemberRegister(BaseModel):
    ogrenci_no: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class MemberLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "member"
    ogrenci_no: str


# --- KULÜP GÖRÜNTÜLEME ŞEMALARI (Üye gözünden) ---

class ClubPublic(BaseModel):
    id: int
    name: str
    description: Optional[str]
    email: Optional[str]
    phone: Optional[str]

    # Detay sayfasında gösterebileceğimiz ekstra alanlar
    mission: Optional[str] = None
    vision: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# Bunu dosyanın en altına ekle
class MemberProfile(BaseModel):
    ogrenci_no: str
    first_name: str
    last_name: str
    email: EmailStr

    class Config:
        from_attributes = True
