from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.data_access_layer import db, models
import os

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=db.engine)

app = FastAPI(title="UniClub API (SQLite)")

# --- CORS ayarları ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ya da sadece frontend adresin: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS ayarları son ---

# Bağlantı oturumu
def get_db():
    database = db.SessionLocal()
    try:
        yield database
    finally:
        database.close()

@app.get("/")
def root():
    return {"message": "UniClub API çalışıyor 🚀"}

@app.get("/clubs")
def list_clubs(database: Session = Depends(get_db)):
    clubs = database.query(models.Club).all()
    return clubs

@app.post("/clubs")
def create_club(name: str, description: str = "", database: Session = Depends(get_db)):
    new_club = models.Club(name=name, description=description)
    database.add(new_club)
    database.commit()
    database.refresh(new_club)
    return {"message": "Kulüp eklendi ✅", "club": new_club.name}

@app.post("/clubs/sample-data")
def add_sample_data(database: Session = Depends(get_db)):
    """Veritabanına örnek veri ekler"""
    sample_clubs = [
        {"name": "Bilgisayar Mühendisliği Kulübü", "description": "Teknoloji ve programlama etkinlikleri"},
        {"name": "Fotoğrafçılık Kulübü", "description": "Fotoğraf çekimi ve sanat etkinlikleri"},
        {"name": "Müzik Kulübü", "description": "Müzik performansları ve konserler"},
        {"name": "Spor Kulübü", "description": "Futbol, basketbol ve diğer spor aktiviteleri"},
        {"name": "Tiyatro Kulübü", "description": "Oyunlar ve sahne performansları"}
    ]
    
    added_clubs = []
    for club_data in sample_clubs:
        # Aynı isimde kulüp var mı kontrol et
        existing_club = database.query(models.Club).filter(models.Club.name == club_data["name"]).first()
        if not existing_club:
            new_club = models.Club(name=club_data["name"], description=club_data["description"])
            database.add(new_club)
            added_clubs.append(club_data["name"])
    
    sample_gelistirme = models.Gelistirme(description="Bu site geliştirme aşamasındadır.")
    database.add(sample_gelistirme)
    
    database.commit()
    return {"message": f"{len(added_clubs)} örnek kulüp eklendi ✅", "added_clubs": added_clubs}

@app.get("/gelistirme")
def get_gelistirme(database: Session = Depends(get_db)):
    # En son eklenen geliştirilmeyi al
    gelistirme = database.query(models.Gelistirme).order_by(models.Gelistirme.id.desc()).first()
    if gelistirme:
        return {"description": gelistirme.description}
    return {"description": "Henüz içerik yok."}
