from app.webAPI_layer.routers import auth, clubs, events

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..data_access_layer import models
from ..data_access_layer.db import engine
from .routers import auth, clubs, events

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="UniClub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

app.include_router(auth.router)
app.include_router(clubs.router)
app.include_router(events.router)

@app.get("/")
def root(): return {"message": "UniClub API"}
