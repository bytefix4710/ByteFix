from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.webAPI_layer.routers.club_admin import auth as club_admin_auth
from app.webAPI_layer.routers.club_admin import club as club_admin_club
from app.webAPI_layer.routers.club_admin import members as club_admin_members
from app.webAPI_layer.routers.club_admin import stats as club_admin_stats
from app.webAPI_layer.routers.super_admin import auth as super_admin_auth
from app.webAPI_layer.routers.super_admin import club as super_admin_club
from app.webAPI_layer.routers.super_admin import stats as super_admin_stats
from app.webAPI_layer.routers.member import auth as user_auth
from app.webAPI_layer.routers.member import club as user_club

app = FastAPI(title="UniClub API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "UniClub API çalışıyor"}


# Kulüp admini routerları
app.include_router(club_admin_auth.router)
app.include_router(club_admin_club.router)
app.include_router(club_admin_members.router)
app.include_router(club_admin_stats.router)

# Süper admin routerları
app.include_router(super_admin_auth.router)
app.include_router(super_admin_club.router)
app.include_router(super_admin_stats.router)

# Üye (Member) Routerları
app.include_router(user_auth.router)
app.include_router(user_club.router)
