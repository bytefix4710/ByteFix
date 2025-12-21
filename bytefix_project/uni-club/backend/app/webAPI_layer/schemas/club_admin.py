from datetime import datetime as dt
from typing import Optional
from pydantic import BaseModel


class ClubAdminRegister(BaseModel):
    email: str
    password: str

class ClubAdminPublic(BaseModel):
    hesap_id: int
    email: str
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class ClubPublic(BaseModel):
    id: int
    name: str
    description: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    admin_id: Optional[int]

    class Config:
        orm_mode = True

class EventCreate(BaseModel):
    name: str
    datetime: dt
    description: Optional[str] = None
    image_url: Optional[str] = None


class EventUpdate(BaseModel):
    name: Optional[str] = None
    datetime: Optional[dt] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class EventPublic(BaseModel):
    etkinlik_id: int
    name: str
    datetime: dt
    description: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        orm_mode = True

class EventRegPublic(BaseModel):
    kayit_id: int
    etkinlik_id: int
    ogrenci_id: str
    status: str

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        orm_mode = True

class AnnouncementCreate(BaseModel):
    description: str

class AnnouncementPublic(BaseModel):
    duyuru_id: int
    kulup_id: int
    description: str

    class Config:
        orm_mode = True  # v2 uyarısı sorun değil, istersen from_attributes'a geçeriz
