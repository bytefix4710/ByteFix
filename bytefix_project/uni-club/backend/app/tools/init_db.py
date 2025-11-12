from app.data_access_layer.db import engine
from app.data_access_layer import models

models.Base.metadata.create_all(bind=engine)
print("DB tabloları oluşturuldu.")
