from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserPublic(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class EventCreate(BaseModel):
    club_id: int
    title: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    start_time: datetime
    end_time: datetime

class EventPublic(BaseModel):
    id: int
    club_id: int
    title: str
    description: str
    location: str
    start_time: datetime
    end_time: datetime
    is_published: bool
    class Config:
        orm_mode = True
