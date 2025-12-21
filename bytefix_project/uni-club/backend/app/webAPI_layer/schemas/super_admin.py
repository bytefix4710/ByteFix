from pydantic import BaseModel
from typing import Optional, List

class SuperAdminRegister(BaseModel):
    email: str
    password: str

class SuperAdminPublic(BaseModel):
    email: str
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ClubCreate(BaseModel):
    name: str
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    admin_id: Optional[int] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    image_url: Optional[str] = None

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    admin_id: Optional[int] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    image_url: Optional[str] = None

class ClubPublic(BaseModel):
    id: int
    name: str
    description: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    admin_id: Optional[int]
    mission: Optional[str]
    vision: Optional[str]
    image_url: Optional[str]

    class Config:
        orm_mode = True

class StatsResponse(BaseModel):
    total_clubs: int
    total_members: int
    total_announcements: int = 0
    total_events: int = 0

class EventPublic(BaseModel):
    etkinlik_id: int
    kulup_id: int
    kulup_name: str
    name: str
    datetime: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    
    class Config:
        orm_mode = True

class UserPublic(BaseModel):
    user_type: str  # "member" veya "admin"
    id: str  # ogrenci_no veya hesap_id
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    club_id: Optional[int] = None
    club_name: Optional[str] = None
    
    class Config:
        orm_mode = True

