from app.data_access_layer.db import engine
from app.data_access_layer import models

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    print("DB tabloları oluşturuldu (member, club_admin, super_admin, club, membership, event, event_reg).")
