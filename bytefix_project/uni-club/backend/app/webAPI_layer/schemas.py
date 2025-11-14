from pydantic import BaseModel
from typing import Optional


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


class ClubPublic(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    admin_id: Optional[int] = None

    class Config:
        orm_mode = True


class ClubUpdate(BaseModel):
    # Güncelleme isteğinde gönderilecek alanlar
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
