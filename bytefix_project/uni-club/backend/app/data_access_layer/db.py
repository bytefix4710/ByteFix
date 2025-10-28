from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Proje dizini altındaki "data" klasörünü kullanacağız
db_folder = os.path.join(os.path.dirname(__file__), "database")
os.makedirs(db_folder, exist_ok=True)  # Eğer klasör yoksa oluştur

db_path = os.path.join(db_folder, "uniclub.db")

# SQLite bağlantısı
DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
