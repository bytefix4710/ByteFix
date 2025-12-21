from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.webAPI_layer.routers.club_admin import auth as club_admin_auth
from app.webAPI_layer.routers.club_admin import club as club_admin_club
from app.webAPI_layer.routers.club_admin import members as club_admin_members
from app.webAPI_layer.routers.club_admin import stats as club_admin_stats
from app.webAPI_layer.routers.club_admin import event as club_admin_events
from app.webAPI_layer.routers.super_admin import auth as super_admin_auth
from app.webAPI_layer.routers.super_admin import club as super_admin_club
from app.webAPI_layer.routers.super_admin import stats as super_admin_stats
from app.webAPI_layer.routers.super_admin import users as super_admin_users
from app.webAPI_layer.routers.super_admin import events as super_admin_events
from app.webAPI_layer.routers.member import auth as user_auth
from app.webAPI_layer.routers.member import club as user_club
from app.webAPI_layer.routers.club_admin import announcement as club_admin_announcement


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
app.include_router(club_admin_events.router)
app.include_router(club_admin_announcement.router)

# Süper admin routerları
app.include_router(super_admin_auth.router)
app.include_router(super_admin_club.router)
app.include_router(super_admin_stats.router)
app.include_router(super_admin_users.router)
app.include_router(super_admin_events.router)

# Üye (Member) Routerları
app.include_router(user_auth.router)
app.include_router(user_club.router)
