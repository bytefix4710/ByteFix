from datetime import datetime, timedelta
from app.data_access_layer.db import SessionLocal, engine
from app.data_access_layer import models
from app.business_logic_layer.services.club_admin.auth_service import hash_password
import random

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
            mission="Üniversitemizde teknoloji bilincini artırmak, öğrencilere yazılım geliştirme, donanım tasarımı, siber güvenlik ve yapay zeka alanlarında pratik deneyim kazandırmak. Öğrencilerin teknolojik yetkinliklerini geliştirerek, sektörde rekabetçi ve yenilikçi bireyler olarak yetişmelerini sağlamak.",
            vision="Türkiye'nin en üretken ve yenilikçi öğrenci teknoloji topluluğu olmak. Ulusal ve uluslararası projelerde başarılar elde ederek, üniversitemizi teknoloji alanında temsil etmek ve öğrencilerimizi geleceğin teknoloji liderlerine dönüştürmek.",
            image_url="bilmuh.jpg",
        )
        club2 = models.Club(
            name="Fotoğrafçılık Kulübü",
            admin_id=admin2.hesap_id,
            email="fotograf@uni.test",
            phone="0500 000 00 02",
            description="Fotoğraf çekimi, sergi hazırlama ve gezi organizasyonları.",
            mission="Fotoğraf sanatını öğrencilere tanıtmak, görsel estetik anlayışlarını geliştirmek ve fotoğrafçılık tekniklerini öğretmek. Öğrencilerin yaratıcılıklarını keşfetmelerine yardımcı olmak, sergi ve yarışmalar düzenleyerek sanatsal gelişimlerini desteklemek.",
            vision="Ulusal ve uluslararası fotoğraf yarışmalarında derece kazanan, sanat dünyasında tanınan bir kulüp olmak. Üniversitemizin kültür-sanat etkinliklerinde öncü rol oynayarak, fotoğraf sanatını kampüste yaygınlaştırmak.",
            image_url="fotograf.jpg",
        )
        club3 = models.Club(
            name="Müzik Kulübü",
            admin_id=admin3.hesap_id,
            email="muzik@uni.test",
            phone="0500 000 00 03",
            description="Enstrüman eğitimleri, sahne performansları, konser organizasyonları.",
            mission="Öğrencilerin müzik yolculuğunu desteklemek, enstrüman eğitimleri sunmak ve sahne performansları için fırsatlar yaratmak. Müzik sevgisini kampüste yaygınlaştırarak, öğrencilerin sanatsal yeteneklerini keşfetmelerine ve geliştirmelerine yardımcı olmak.",
            vision="Üniversitenin kültür-sanat etkinliklerinin merkezinde olmak, düzenli konserler ve müzik festivalleri organize ederek kampüs yaşamını renklendirmek. Müzik alanında profesyonel kariyer hedefleyen öğrencilere destek sağlamak.",
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
        # 6) 20 ETKİNLİK (KULÜPLERE MANTIKLI DAĞILIM + DENGELİ TARİH)
        # ============================
        now = datetime.now()
        
        # Kulüp bazında etkinlik şablonları
        cs_events = [
            ("Python ile Veri Bilimi Atölyesi", "Makine öğrenmesi giriş eğitimi ve uygulama.", "python_event.jpg"),
            ("Siber Güvenlik Capture The Flag", "Temel sızma testleri ve CTF yarışması.", "ctf.jpg"),
            ("Web Geliştirme Workshop", "Modern web teknolojileri ve full-stack development.", "web_dev.jpg"),
            ("Yapay Zeka Semineri", "Derin öğrenme ve neural network uygulamaları.", "ai_seminar.jpg"),
            ("Hackathon 2024", "24 saatlik yazılım geliştirme yarışması.", "hackathon.jpg"),
            ("Backend Mimarisi Eğitimi", "Mikroservis ve API tasarımı atölyesi.", "backend.jpg"),
            ("Mobil Uygulama Geliştirme", "iOS ve Android uygulama geliştirme temelleri.", "mobile.jpg"),
        ]
        
        photo_events = [
            ("Drone Çekim Atölyesi", "Havadan çekim teknikleri ve uygulama gezisi.", "drone.jpg"),
            ("Portre Çekim Workshop", "Model ile profesyonel portre çekim etkinliği.", "portrait.jpg"),
            ("Sokak Fotoğrafçılığı Gezisi", "Şehir içi fotoğraf çekimi ve kompozisyon teknikleri.", "street_photo.jpg"),
            ("Stüdyo Aydınlatma Eğitimi", "Profesyonel stüdyo ışık düzenleme teknikleri.", "studio.jpg"),
            ("Fotoğraf Sergisi Açılışı", "Kulüp üyelerinin çalışmalarının sergilenmesi.", "exhibition.jpg"),
            ("Doğa Fotoğrafçılığı Kampı", "Hafta sonu doğa ve manzara fotoğrafçılığı.", "nature.jpg"),
        ]
        
        music_events = [
            ("Açık Sahne Konseri", "Öğrenci gruplarının canlı performansları.", "konser.jpg"),
            ("Gitar Eğitim Dersi", "Gitar teknikleri ve performans çalışmaları.", "gitar.jpg"),
            ("Bateri Workshop", "Ritim ve bateri çalma teknikleri eğitimi.", "drums.jpg"),
            ("Vokal Eğitimi", "Ses teknikleri ve sahne performansı dersleri.", "vocal.jpg"),
            ("Müzik Teorisi Semineri", "Armoni, melodi ve kompozisyon temelleri.", "theory.jpg"),
            ("Akustik Gece", "Akustik enstrümanlarla samimi konser.", "acoustic.jpg"),
            ("Müzik Prodüksiyon Atölyesi", "Dijital müzik yapımı ve kayıt teknikleri.", "production.jpg"),
        ]

        # Tüm etkinlikleri kulüp ID'leriyle birlikte hazırla
        all_events_with_club = []
        for name, desc, img in cs_events:
            all_events_with_club.append((club1.kulup_id, name, desc, img))
        for name, desc, img in photo_events:
            all_events_with_club.append((club2.kulup_id, name, desc, img))
        for name, desc, img in music_events:
            all_events_with_club.append((club3.kulup_id, name, desc, img))
        
        # Karıştır - böylece past/future dağılımı her kulüpte dengeli olur
        random.shuffle(all_events_with_club)
        
        # Etkinlikleri oluştur
        events = []
        for i, (kulup_id, name, desc, img) in enumerate(all_events_with_club):
            # İlk 8 etkinlik geçmiş, kalan 12 gelecek
            if i < 8:
                days_offset = -5 - (i * 7)  # Geçmiş
            else:
                days_offset = 1 + ((i - 8) * 2)  # Gelecek
            
            ev = models.Event(
                kulup_id=kulup_id,
                name=name,
                datetime=now + timedelta(days=days_offset),
                description=desc,
                image_url=img,
                kontenjan=random.choice([10, 15, 20, 25, 30]),
            )
            events.append(ev)

        db.add_all(events)
        db.commit()

        for ev in events:
            db.refresh(ev)

        # ============================
        # 7) ETKİNLİK KAYITLARI (GERÇEKÇİ DAĞILIM)
        # ============================
        # Gerçekçi kayıt çeşitliliği:
        # - Bazı etkinlikler: 0 kayıt
        # - Bazı etkinlikler: kısmi dolu (2-8 kişi)
        # - Bazı etkinlikler: neredeyse dolu (kontenjan - 1 veya - 2)
        # - Bazı etkinlikler: tamamen dolu
        
        event_regs = []
        
        for i, event_obj in enumerate(events):
            # Etkinlik başına kaç kayıt olacağını belirle
            if i < 5:
                # İlk 5 etkinlik: 0 kayıt (boş)
                reg_count = 0
            elif i < 15:
                # 10 etkinlik: kısmi dolu (2-8 arası, ama kontenjanı aşmayacak)
                max_partial = min(8, event_obj.kontenjan - 1)
                reg_count = random.randint(2, max(2, max_partial))
            elif i < 18:
                # 3 etkinlik: neredeyse dolu
                reg_count = event_obj.kontenjan - random.randint(1, 2)
            else:
                # Son 2 etkinlik: tamamen dolu
                reg_count = event_obj.kontenjan
            
            # Belirlenen sayıda kayıt oluştur
            for j in range(reg_count):
                # Farklı öğrenciler seç (tekrar etmemesi için modulo kullan)
                member_idx = (i * 3 + j) % len(members)
                ogr_no = members[member_idx].ogrenci_no
                
                # Kayıt durumu: çoğunlukla onaylı, bazen beklemede
                status = models.STATUS_APPROVED if j % 4 != 0 else models.STATUS_PENDING
                
                event_regs.append(
                    models.EventReg(
                        etkinlik_id=event_obj.etkinlik_id,
                        ogrenci_id=ogr_no,
                        status=status,
                    )
                )

        db.add_all(event_regs)
        db.commit()

        print("Gerçekçi örnek veriler başarıyla eklendi!")
        print(f" - Öğrenciler: {len(members)}")
        print(f" - Üyelikler: {len(memberships)}")
        print(f" - Etkinlikler: {len(events)}")
        print(f" - Etkinlik kayıtları: {len(event_regs)}")
        print(f" - Duyurular: {len(announcements)}")


    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed()
