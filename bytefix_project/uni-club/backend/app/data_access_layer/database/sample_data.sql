-- UniClub Örnek Veri SQL Script
-- Bu dosya veritabanına örnek kulüp verilerini ekler

-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM clubs;

-- Örnek kulüp verilerini ekle
INSERT INTO clubs (name, description) VALUES 
('Bilgisayar Mühendisliği Kulübü', 'Teknoloji ve programlama etkinlikleri'),
('Fotoğrafçılık Kulübü', 'Fotoğraf çekimi ve sanat etkinlikleri'),
('Müzik Kulübü', 'Müzik performansları ve konserler'),
('Spor Kulübü', 'Futbol, basketbol ve diğer spor aktiviteleri'),
('Tiyatro Kulübü', 'Oyunlar ve sahne performansları'),
('Kitap Kulübü', 'Kitap okuma ve tartışma etkinlikleri'),
('Dans Kulübü', 'Modern dans ve geleneksel dans gösterileri'),
('Çevre Kulübü', 'Çevre koruma ve sürdürülebilirlik projeleri'),
('Girişimcilik Kulübü', 'İş fikirleri ve startup projeleri'),
('Yabancı Dil Kulübü', 'İngilizce, Almanca ve diğer diller');

-- Verilerin eklendiğini kontrol et
SELECT COUNT(*) as toplam_kulup_sayisi FROM clubs;
SELECT * FROM clubs ORDER BY name;

insert into gelistirme_asamasi (description) values ('Sitemiz geliştirme aşamasındadır. Yeni özellikler yakında eklenecektir.');
SELECT * FROM gelistirme_asamasi;