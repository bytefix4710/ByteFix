from datetime import datetime, timedelta

from app.data_access_layer.db import SessionLocal, engine
from app.data_access_layer import models
from app.business_logic_layer.services.club_admin.auth_service import hash_password


def reset_and_seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ============================
        # TÜM TABLOLARI TEMİZLE
        # ============================
        db.query(models.EventReg).delete()
        db.query(models.Event).delete()
        db.query(models.Announcement).delete() 
        db.query(models.Membership).delete()
        db.query(models.Club).delete()
        db.query(models.ClubAdmin).delete()
        db.query(models.SuperAdmin).delete()
        db.query(models.Member).delete()
        db.commit()

        # ============================
        # 1) 20 GERÇEKÇİ ÜYE
        # ============================
        member_data = [
    ("2001", "Ahmet", "Korkmaz", "ahmet.korkmaz@uni.com", "ahmet123"),
    ("2002", "Zeynep", "Aslan", "zeynep.aslan@uni.com", "zeynep123"),
    ("2003", "Mert", "Demirci", "mert.demirci@uni.com", "mert123"),
    ("2004", "Elif", "Aydın", "elif.aydin@uni.com", "elif123"),
    ("2005", "Burak", "Taş", "burak.tas@uni.com", "burak123"),
    ("2006", "Deniz", "Aksoy", "deniz.aksoy@uni.com", "deniz123"),
    ("2007", "Beyza", "Keskin", "beyza.keskin@uni.com", "beyza123"),
    ("2008", "Yusuf", "Güler", "yusuf.guler@uni.com", "yusuf123"),
    ("2009", "Derya", "Öztürk", "derya.ozturk@uni.com", "derya123"),
    ("2010", "Kerem", "Bulut", "kerem.bulut@uni.com", "kerem123"),
    ("2011", "Seda", "Yalçın", "seda.yalcin@uni.com", "seda123"),
    ("2012", "Okan", "Kaya", "okan.kaya@uni.com", "okan123"),
    ("2013", "İrem", "Güneş", "irem.gunes@uni.com", "irem123"),
    ("2014", "Can", "Kaplan", "can.kaplan@uni.com", "can123"),
    ("2015", "Melisa", "Ergin", "melisa.ergin@uni.com", "melisa123"),
    ("2016", "Ege", "Uçar", "ege.ucar@uni.com", "ege123"),
    ("2017", "Selin", "Polat", "selin.polat@uni.com", "selin123"),
    ("2018", "Oğuz", "Çağlar", "oguz.caglar@uni.com", "oguz123"),
    ("2019", "Sinem", "Koç", "sinem.koc@uni.com", "sinem123"),
    ("2020", "Barış", "Arslan", "baris.arslan@uni.com", "baris123"),
]


        members = []
        for ogr_no, ad, soyad, email, sifre in member_data:
            members.append(
                models.Member(
                    ogrenci_no=ogr_no,
                    first_name=ad,
                    last_name=soyad,
                    email=email,
                    password_hash=hash_password(sifre),
                )
            )
        db.add_all(members)
        db.commit()

        # ============================
        # 2) KULÜP ADMİNLERİ (3)
        # ============================
        admin1 = models.ClubAdmin(email="admin1@uniclub.test", password_hash=hash_password("admin1"))
        admin2 = models.ClubAdmin(email="admin2@uniclub.test", password_hash=hash_password("admin2"))
        admin3 = models.ClubAdmin(email="admin3@uniclub.test", password_hash=hash_password("admin3"))

        db.add_all([admin1, admin2, admin3])
        db.commit()
        db.refresh(admin1)
        db.refresh(admin2)
        db.refresh(admin3)

        # ============================
        # 3) SÜPER ADMİN
        # ============================
        super_admin = models.SuperAdmin(
            email="super@uniclub.test",
            password_hash=hash_password("superadmin"),
        )
        db.add(super_admin)
        db.commit()

        # ============================
        # 4) 3 KULÜP
        # ============================
        club1 = models.Club(
            name="Bilgisayar Mühendisliği Kulübü",
            admin_id=admin1.hesap_id,
            email="bilmuh@uni.test",
            phone="0500 000 00 01",
            description="Yazılım, donanım, siber güvenlik, yapay zeka çalışmaları.",
            mission="Üniversitede teknoloji bilincini artırmak.",
            vision="Türkiye'nin en üretken öğrenci teknoloji topluluğu olmak.",
            image_url="bilmuh.jpg",
        )
        club2 = models.Club(
            name="Fotoğrafçılık Kulübü",
            admin_id=admin2.hesap_id,
            email="fotograf@uni.test",
            phone="0500 000 00 02",
            description="Fotoğraf çekimi, sergi hazırlama ve gezi organizasyonları.",
            mission="Fotoğraf sanatını öğrencilere tanıtmak.",
            vision="Ulusal yarışmalarda derece kazanan bir kulüp olmak.",
            image_url="fotograf.jpg",
        )
        club3 = models.Club(
            name="Müzik Kulübü",
            admin_id=admin3.hesap_id,
            email="muzik@uni.test",
            phone="0500 000 00 03",
            description="Enstrüman eğitimleri, sahne performansları, konser organizasyonları.",
            mission="Öğrencilerin müzik yolculuğunu desteklemek.",
            vision="Üniversitenin kültür-sanat etkinliklerinin merkezinde olmak.",
            image_url="muzik.jpg",
        )

        db.add_all([club1, club2, club3])
        db.commit()

        clubs = [club1, club2, club3]
        
        # =========================
        # DUYURULAR (ANNOUNCEMENT)
        # =========================
        announcements = [
    models.Announcement(
        kulup_id=club1.kulup_id,
        title="Yeni Dönem Atölye Takvimi",
        description="Yeni dönem için Python, Yapay Zeka ve Backend atölyeleri planlanıyor. Takvim bu hafta paylaşılacak.",
        created_at=datetime.now() - timedelta(days=2),
    ),
    models.Announcement(
        kulup_id=club1.kulup_id,
        title="Kulüp Toplantısı",
        description="18 Aralık Salı 17:30'da B-201'de dönem planlama toplantısı yapılacaktır.",
        created_at=datetime.now() - timedelta(days=1),
    ),

    models.Announcement(
        kulup_id=club2.kulup_id,
        title="Fotoğraf Gezisi Başvuruları",
        description="Hafta sonu şehir içi fotoğraf gezisi düzenlenecek. Katılım için duyuru altındaki formu doldurun.",
        created_at=datetime.now() - timedelta(days=3),
    ),
    models.Announcement(
        kulup_id=club2.kulup_id,
        title="Portre Workshop Kayıtları Açıldı",
        description="Portre fotoğrafçılığı workshop'u için kayıtlar açıldı. Kontenjan 20 kişi ile sınırlıdır.",
        created_at=datetime.now() - timedelta(days=1, hours=4),
    ),

    models.Announcement(
        kulup_id=club3.kulup_id,
        title="Bahar Konseri Seçmeleri",
        description="Bahar konserinde sahne alacak öğrenci grupları için seçmeler başlıyor. Başvuru için kulüp odasına bekleniyorsunuz.",
        created_at=datetime.now() - timedelta(days=4),
    ),
    models.Announcement(
        kulup_id=club3.kulup_id,
        title="Yeni Enstrüman Dersleri",
        description="Gitar ve bateri dersleri için yeni kontenjan açılmıştır. Ders saatleri haftalık olarak paylaşılacaktır.",
        created_at=datetime.now() - timedelta(days=2, hours=6),
    ),
]

        db.add_all(announcements)
        db.commit()


        # ============================
        # 5) 20 ÜYELİK
        # ============================
        statuses = [models.STATUS_APPROVED, models.STATUS_PENDING, models.STATUS_REJECTED]

        memberships = []
        for i, m in enumerate(members):
            memberships.append(
                models.Membership(
                    kulup_id=clubs[i % 3].kulup_id,
                    ogrenci_id=m.ogrenci_no,
                    status=statuses[i % 3],
                )
            )

        db.add_all(memberships)
        db.commit()

        # ============================
        # 6) 20 ETKİNLİK
        # ============================
        now = datetime.now()
        events = []

        event_templates = [
            ("Python ile Veri Bilimi Atölyesi", "Makine öğrenmesi giriş eğitimi ve uygulama.", "python_event.jpg"),
            ("Siber Güvenlik Capture The Flag", "Temel sızma testleri ve CTF yarışması.", "ctf.jpg"),
            ("Drone Çekim Atölyesi", "Havadan çekim teknikleri ve uygulama gezisi.", "drone.jpg"),
            ("Portre Çekim Workshop", "Model ile profesyonel portre çekim etkinliği.", "portrait.jpg"),
            ("Açık Sahne Konseri", "Öğrenci gruplarının canlı performansları.", "konser.jpg"),
            ("Gitar Eğitim Dersi", "Gitar teknikleri ve performans çalışmaları.", "gitar.jpg"),
        ]

        for i in range(20):
            club = clubs[i % 3]
            name, desc, img = event_templates[i % len(event_templates)]
            ev = models.Event(
                kulup_id=club.kulup_id,
                name=f"{name} #{i+1}",
                datetime=now + timedelta(days=i + 1),
                description=desc,
                image_url=img,
            )
            events.append(ev)

        db.add_all(events)
        db.commit()

        for ev in events:
            db.refresh(ev)

        # ============================
        # 7) 20 ETKİNLİK KAYDI
        # ============================
        event_regs = []

        for i in range(20):
            event_obj = events[i]
            ogr_no = members[i].ogrenci_no
            status = statuses[(i + 1) % 3]
            event_regs.append(
                models.EventReg(
                    etkinlik_id=event_obj.etkinlik_id,
                    ogrenci_id=ogr_no,
                    status=status,
                )
            )

        db.add_all(event_regs)
        db.commit()

        print("Gerçekçi örnek veriler başarıyla eklendi! 🎉")
        print(f" - Öğrenciler: {len(members)}")
        print(f" - Üyelikler: {len(memberships)}")
        print(f" - Etkinlikler: {len(events)}")
        print(f" - Etkinlik kayıtları: {len(event_regs)}")
        print(f" - Duyurular: {len(announcements)}")


    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed()
