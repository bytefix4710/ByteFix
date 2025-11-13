from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data_access_layer import db, models
from app.webAPI_layer.routers import auth, clubs

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=db.engine)

app = FastAPI(title="UniClub API (SQLite)")

# --- CORS ayarları ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # istersen buraya spesifik origin yaz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "UniClub API çalışıyor 🚀"}


# router'ları bağla
app.include_router(auth.router)
app.include_router(clubs.router)
