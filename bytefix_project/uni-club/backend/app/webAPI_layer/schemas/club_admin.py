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
