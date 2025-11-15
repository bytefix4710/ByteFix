from datetime import datetime, timedelta

from app.data_access_layer.db import SessionLocal, engine
from app.data_access_layer import models
from app.business_logic_layer.services.club_admin.auth_service import hash_password


def reset_and_seed():
    # Tablolar yoksa oluştur
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # --- TÜM VERİYİ TEMİZLE (FK sırasına dikkat) ---
        db.query(models.EventReg).delete()
        db.query(models.Event).delete()
        db.query(models.Membership).delete()
        db.query(models.Club).delete()
        db.query(models.ClubAdmin).delete()
        db.query(models.SuperAdmin).delete()
        db.query(models.Member).delete()
        db.commit()

        # --- 3 ÜYE (member tablosu) ---
        member1 = models.Member(
            ogrenci_no="1001",
            first_name="Ali",
            last_name="Yılmaz",
            email="ali@example.com",
            password_hash=hash_password("ali123"),
        )
        member2 = models.Member(
            ogrenci_no="1002",
            first_name="Ayşe",
            last_name="Demir",
            email="ayse@example.com",
            password_hash=hash_password("ayse123"),
        )
        member3 = models.Member(
            ogrenci_no="1003",
            first_name="Mehmet",
            last_name="Kaya",
            email="mehmet@example.com",
            password_hash=hash_password("mehmet123"),
        )
        db.add_all([member1, member2, member3])
        db.commit()

        # --- 3 KULÜP ADMİNİ (club_admin tablosu) ---
        admin1 = models.ClubAdmin(
            email="admin1@uniclub.test",
            password_hash=hash_password("admin1"),
        )
        admin2 = models.ClubAdmin(
            email="admin2@uniclub.test",
            password_hash=hash_password("admin2"),
        )
        admin3 = models.ClubAdmin(
            email="admin3@uniclub.test",
            password_hash=hash_password("admin3"),
        )
        db.add_all([admin1, admin2, admin3])
        db.commit()
        db.refresh(admin1)
        db.refresh(admin2)
        db.refresh(admin3)

        # --- 1 SÜPER ADMİN (super_admin tablosu) ---
        super_admin = models.SuperAdmin(
            email="super@uniclub.test",
            password_hash=hash_password("superadmin"),
        )
        db.add(super_admin)
        db.commit()

        # --- 3 KULÜP (club tablosu) ---
        club1 = models.Club(
            name="Bilgisayar Mühendisliği Kulübü",
            admin_id=admin1.hesap_id,
            email="bilmuh@uni.test",
            phone="0500 000 00 01",
            description="Yazılım, donanım ve teknoloji odaklı kulüp.",
        )
        club2 = models.Club(
            name="Fotoğrafçılık Kulübü",
            admin_id=admin2.hesap_id,
            email="fotograf@uni.test",
            phone="0500 000 00 02",
            description="Fotoğraf çekmeyi sevenler için.",
        )
        club3 = models.Club(
            name="Müzik Kulübü",
            admin_id=admin3.hesap_id,
            email="muzik@uni.test",
            phone="0500 000 00 03",
            description="Enstrüman ve vokal çalışmaları.",
        )
        db.add_all([club1, club2, club3])
        db.commit()
        db.refresh(club1)
        db.refresh(club2)
        db.refresh(club3)

        # --- 5 ÜYELİK (membership tablosu) ---
        # 1001: club1 + club3
        # 1002: club1 + club2
        # 1003: club2
        mship1 = models.Membership(kulup_id=club1.kulup_id, ogrenci_id="1001")
        mship2 = models.Membership(kulup_id=club1.kulup_id, ogrenci_id="1002")
        mship3 = models.Membership(kulup_id=club2.kulup_id, ogrenci_id="1002")
        mship4 = models.Membership(kulup_id=club2.kulup_id, ogrenci_id="1003")
        mship5 = models.Membership(kulup_id=club3.kulup_id, ogrenci_id="1001")
        db.add_all([mship1, mship2, mship3, mship4, mship5])
        db.commit()

        # --- 2 ETKİNLİK (event tablosu) ---
        now = datetime.now()
        event1 = models.Event(
            kulup_id=club1.kulup_id,
            name="Algoritma Çalıştayı",
            datetime=now + timedelta(days=3),
        )
        event2 = models.Event(
            kulup_id=club2.kulup_id,
            name="Şehir Turu Fotoğraf Gezisi",
            datetime=now + timedelta(days=7),
        )
        db.add_all([event1, event2])
        db.commit()
        db.refresh(event1)
        db.refresh(event2)

        # --- 5 ETKİNLİK KAYDI (event_reg tablosu) ---
        # event1: 1001, 1002, 1003
        # event2: 1001, 1003
        reg1 = models.EventReg(etkinlik_id=event1.etkinlik_id, ogrenci_id="1001")
        reg2 = models.EventReg(etkinlik_id=event1.etkinlik_id, ogrenci_id="1002")
        reg3 = models.EventReg(etkinlik_id=event1.etkinlik_id, ogrenci_id="1003")
        reg4 = models.EventReg(etkinlik_id=event2.etkinlik_id, ogrenci_id="1001")
        reg5 = models.EventReg(etkinlik_id=event2.etkinlik_id, ogrenci_id="1003")
        db.add_all([reg1, reg2, reg3, reg4, reg5])
        db.commit()

        print("Örnek veriler başarıyla eklendi ✅")
        print(f" - Üyeler: 3")
        print(f" - Kulüp adminleri: 3")
        print(f" - Süper admin: 1")
        print(f" - Kulüpler: 3")
        print(f" - Üyelikler: 5")
        print(f" - Etkinlikler: 2")
        print(f" - Etkinlik kayıtları: 5")

    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed()
