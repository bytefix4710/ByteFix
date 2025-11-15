from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.webAPI_layer.routers.club_admin import auth as club_admin_auth
from app.webAPI_layer.routers.club_admin import club as club_admin_club

app = FastAPI(title="UniClub API (Kulüp Admini Odaklı)")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "UniClub API çalışıyor (kulüp admini modülü aktif)"}


# Kulüp admini routerları
app.include_router(club_admin_auth.router)
app.include_router(club_admin_club.router)
