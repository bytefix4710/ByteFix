# UniClub - Veritabanı Örnek Veri Yükleme

Bu klasörde veritabanına örnek veri yüklemek için 3 farklı yöntem bulunmaktadır:

## 1. SQL Script ile (sample_data.sql)
```bash
# SQLite komut satırı ile
sqlite3 uniclub.db < sample_data.sql

# Veya SQLite browser ile dosyayı açıp çalıştırın
```

## 2. Python Script ile (load_sample_data.py)
```bash
# Backend klasöründe
python load_sample_data.py
```

## 3. API Endpoint ile
```bash
# Backend çalışırken
curl -X POST http://127.0.0.1:8000/clubs/sample-data

# Veya frontend'de "Örnek Veri Yükle" butonuna tıklayın
```

## Örnek Veriler
Script'ler şu kulüpleri ekler:
- Bilgisayar Mühendisliği Kulübü
- Fotoğrafçılık Kulübü  
- Müzik Kulübü
- Spor Kulübü
- Tiyatro Kulübü
- Kitap Kulübü
- Dans Kulübü
- Çevre Kulübü
- Girişimcilik Kulübü
- Yabancı Dil Kulübü

## Notlar
- SQL script'i mevcut verileri silmez, sadece yeni veriler ekler
- Python script'i çalıştırmadan önce backend'in en az bir kez çalıştırılmış olması gerekir (tabloların oluşması için)
- API endpoint'i duplicate kontrolü yapar (aynı isimde kulüp varsa eklemez)
