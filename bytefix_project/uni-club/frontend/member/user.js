const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "memberToken";

// Sayfa tamamen yüklendiğinde çalışacak ana blok
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Sayfa yüklendi, User.js devrede!");

    // ------- REGISTER İŞLEMİ -------
    const btnRegister = document.getElementById("btnRegister");

    if (btnRegister) {
        console.log("✅ Kayıt butonu bulundu, dinleniyor..."); // Bunu görürsen oldu demektir
        
        btnRegister.addEventListener("click", async () => {
            console.log("🖱️ Kayıt butonuna TIKLANDI."); // Tıklayınca bu çıkmalı

            const ogrenci_no = document.getElementById("regOgrenciNo").value.trim();
            const first_name = document.getElementById("regName").value.trim();
            const last_name = document.getElementById("regSurname").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const msg = document.getElementById("msg");

            if (!ogrenci_no || !first_name || !last_name || !email || !password) {
                if(msg) {
                    msg.textContent = "Lütfen tüm alanları doldur.";
                    msg.className = "status-error";
                }
                return;
            }

            if(msg) {
                msg.textContent = "Kayıt olunuyor...";
                msg.className = "";
            }

            try {
                const res = await fetch(`${API}/members/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ogrenci_no, first_name, last_name, email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.detail || "Kayıt başarısız.");
                }

                // Başarılı
                setToken(data.access_token);
                localStorage.setItem("memberId", data.ogrenci_no);

                if(msg) {
                    msg.textContent = "Kayıt başarılı! Giriş ekranına gidiliyor... 🚀";
                    msg.className = "status-success";
                }
                
                // Yönlendirme
                setTimeout(() => {
                    console.log("🔄 Yönlendirme başlıyor: login.html");
                    window.location.href = "login.html"; 
                }, 1500);

            } catch (err) {
                console.error("❌ Hata:", err);
                if(msg) {
                    msg.textContent = err.message;
                    msg.className = "status-error";
                }
            }
        });
    } else {
        // Eğer register sayfasında değilsek butonu bulamaz, normaldir.
        // Ama register sayfasındaysak ve bu yazıyorsa ID hatası vardır.
        console.log("ℹ️ Bu sayfada 'btnRegister' butonu yok (Normal olabilir).");
    }

    // ------- LOGIN İŞLEMİ -------
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("✅ Login formu bulundu.");
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("🖱️ Giriş yapılıyor...");
            
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const msg = document.getElementById("msg");
            
            if(msg) msg.textContent = "Giriş yapılıyor...";
            
            try {
                const res = await fetch(`${API}/members/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Giriş başarısız.");

                setToken(data.access_token);
                localStorage.setItem("memberId", data.ogrenci_no);
                
                console.log("✅ Giriş başarılı, Dashboard'a gidiliyor.");
                window.location.href = "dashboard.html";
            } catch (err) {
                console.error(err);
                if(msg) {
                    msg.textContent = err.message;
                    msg.className = "status-error";
                }
            }
        });
    }

    // ------- DASHBOARD İŞLEMLERİ -------
    if (document.getElementById("page-overview")) {
        console.log("✅ Dashboard yüklendi.");
        loadProfile();
        loadClubs();
    }
});

// ------- SAYFA YÖNLENDİRME -------

function showPage(pageName) {
    // Tüm sayfaları gizle
    document.querySelectorAll(".page-view").forEach((view) => {
        view.classList.remove("active");
    });

    // Tüm sidebar öğelerini pasif yap
    document.querySelectorAll(".sidebar-item").forEach((item) => {
        item.classList.remove("active");
    });

    // Seçilen sayfayı göster
    const pageView = document.getElementById(`page-${pageName}`);
    if (pageView) {
        pageView.classList.add("active");
    }

    // Seçilen sidebar öğesini aktif yap
    const sidebarItem = document.querySelector(`[data-page="${pageName}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add("active");
    }

    // Sayfaya özel yükleme işlemleri
    if (pageName === "overview") {
        loadProfile();
        loadClubs();
    }
}

window.showPage = showPage;

// ------- YARDIMCI FONKSİYONLAR (Global scope'ta kalsın) -------
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function authHeader() { const t = getToken(); return t ? { Authorization: "Bearer " + t } : {}; }
function logout() { 
    localStorage.removeItem(TOKEN_KEY); 
    localStorage.removeItem("memberId"); 
    window.location.href = "login.html"; 
}
window.logout = logout;

async function loadProfile() {
    const token = getToken();
    if(!token) { window.location.href = "login.html"; return; }
    try {
        const res = await fetch(`${API}/members/me`, {
            headers: { ...authHeader(), "Content-Type": "application/json" }
        });
        if(res.status === 401) { logout(); return; }
        
        const user = await res.json();
        const badge = document.getElementById("userEmailBadge");
        if(badge) badge.textContent = user.email;
        
        const pInfo = document.getElementById("profileInfo");
        if(pInfo) {
             pInfo.innerHTML = `
                <p><span class="label">Öğrenci No:</span> ${user.ogrenci_no}</p>
                <p><span class="label">Ad Soyad:</span> ${user.first_name} ${user.last_name}</p>
                <p><span class="label">E-posta:</span> ${user.email}</p>
             `;
        }
        
        // Form inputlarını doldur
        const inpNo = document.getElementById("profileOgrenciNo");
        const inpName = document.getElementById("profileName");
        const inpSurname = document.getElementById("profileSurname");
        const inpEmail = document.getElementById("profileEmail");

        if(inpNo) inpNo.value = user.ogrenci_no;
        if(inpName) inpName.value = user.first_name;
        if(inpSurname) inpSurname.value = user.last_name;
        if(inpEmail) inpEmail.value = user.email;

    } catch(e) { console.error("Profil hatası:", e); }
}

async function loadClubs() {
    const container = document.getElementById("clubListContainer");
    if(!container) return;
    try {
        const res = await fetch(`${API}/members/clubs`, { headers: authHeader() });
        const clubs = await res.json();
        if(clubs.length > 0) {
            let html = `<ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">`;
            clubs.forEach(c => {
                html += `
                <li class="club-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div><div class="club-name">${c.name}</div><div class="club-desc">${c.description||""}</div></div>
                    <span class="chip">Detay</span>
                </li>`;
            });
            html += `</ul>`;
            container.innerHTML = html;
        } else {
            container.textContent = "Henüz kulüp bulunamadı.";
        }
    } catch(e) { console.error("Kulüp hatası:", e); }
}