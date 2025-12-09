const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "memberToken";

// Kulüp foto mapping (id -> dosya listesi)
// Dosyalar: frontend/assets/clubs/
const CLUB_PHOTOS = {
    1: ["bilmuh_1.jpg", "bilmuh_2.jpg"],
    2: ["foto_1.jpg", "foto_2.jpg"],
    3: ["muzik_1.jpg", "muzik_2.jpg"],
};
const CLUB_PHOTO_BASE = "../assets/clubs/";

// Üyelik overview cache
let membershipOverview = null;
let currentClubInModal = null;

// ==============================
// DOMContentLoaded
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Sayfa yüklendi, User.js devrede!");

    // ------- REGISTER İŞLEMİ -------
    const btnRegister = document.getElementById("btnRegister");

    if (btnRegister) {
        console.log("✅ Kayıt butonu bulundu, dinleniyor...");

        btnRegister.addEventListener("click", async () => {
            console.log("🖱️ Kayıt butonuna TIKLANDI.");

            const ogrenci_no = document.getElementById("regOgrenciNo")?.value.trim();
            const first_name = document.getElementById("regName")?.value.trim();
            const last_name = document.getElementById("regSurname")?.value.trim();
            const email = document.getElementById("regEmail")?.value.trim();
            const password = document.getElementById("regPassword")?.value;
            const msg = document.getElementById("msg");

            if (!ogrenci_no || !first_name || !last_name || !email || !password) {
                if (msg) {
                    msg.textContent = "Lütfen tüm alanları doldur.";
                    msg.className = "status-error";
                }
                return;
            }

            if (msg) {
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

                setToken(data.access_token);
                localStorage.setItem("memberId", data.ogrenci_no);

                if (msg) {
                    msg.textContent = "Kayıt başarılı! Giriş ekranına gidiliyor... 🚀";
                    msg.className = "status-success";
                }

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);

            } catch (err) {
                console.error("❌ Hata:", err);
                if (msg) {
                    msg.textContent = err.message;
                    msg.className = "status-error";
                }
            }
        });
    }

    // ------- LOGIN İŞLEMİ -------
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("✅ Login formu bulundu.");
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("🖱️ Giriş yapılıyor...");

            const email = document.getElementById("email")?.value.trim();
            const password = document.getElementById("password")?.value;
            const msg = document.getElementById("msg");

            if (msg) msg.textContent = "Giriş yapılıyor...";

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

                window.location.href = "dashboard.html";
            } catch (err) {
                console.error(err);
                if (msg) {
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
        loadMembershipOverview();
    }

    // ------- KULÜP DETAY & ÜYE OL (liste satırı click) -------
    document.addEventListener("click", (e) => {
        const detailBtn = e.target.closest(".club-detail-btn");
        if (detailBtn) {
            const clubId = detailBtn.getAttribute("data-club-id");
            if (clubId) {
                showClubDetail(clubId);
            }
        }

        const joinRowBtn = e.target.closest(".club-join-btn");
        if (joinRowBtn) {
            const clubId = joinRowBtn.getAttribute("data-club-id");
            if (clubId) {
                showClubDetail(clubId);
                joinClub(clubId);  // Sadece modal içi mesaj, sayfa değiştirmiyoruz
            }
        }
    });

    // Modal içi "Üye Ol"
    const joinBtn = document.getElementById("btnJoinClub");
    if (joinBtn) {
        joinBtn.addEventListener("click", () => {
            const clubId = joinBtn.getAttribute("data-club-id") || currentClubInModal;
            if (clubId) {
                joinClub(clubId);
            }
        });
    }

    // Modal içi "Başvuruyu Geri Çek"
    const cancelBtn = document.getElementById("btnCancelMembership");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            const clubId = cancelBtn.getAttribute("data-club-id") || currentClubInModal;
            if (clubId) {
                cancelMembership(clubId);
            }
        });
    }

    // Modal kapatma
    const closeBtn = document.getElementById("btnCloseClubModal");
    const modal = document.getElementById("clubDetailModal");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
});

// ==============================
// Sayfa Yönlendirme
// ==============================

function showPage(pageName) {
    document.querySelectorAll(".page-view").forEach((view) => {
        view.classList.remove("active");
    });

    document.querySelectorAll(".sidebar-item").forEach((item) => {
        item.classList.remove("active");
    });

    const pageView = document.getElementById(`page-${pageName}`);
    if (pageView) {
        pageView.classList.add("active");
    }

    const sidebarItem = document.querySelector(`[data-page="${pageName}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add("active");
    }

    if (pageName === "overview") {
        loadProfile();
        loadMembershipOverview();
    } else if (pageName === "clubs") {
        loadClubs();
    }
}

window.showPage = showPage;

// ==============================
// Yardımcı Fonksiyonlar
// ==============================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
}

function authHeader() {
    const t = getToken();
    return t ? { Authorization: "Bearer " + t } : {};
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("memberId");
    window.location.href = "login.html";
}
window.logout = logout;

// ==============================
// Profil & Overview
// ==============================

async function loadProfile() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    try {
        const res = await fetch(`${API}/members/me`, {
            headers: { ...authHeader(), "Content-Type": "application/json" },
        });
        if (res.status === 401) {
            logout();
            return;
        }

        const user = await res.json();
        const badge = document.getElementById("userEmailBadge");
        if (badge) badge.textContent = user.email;

        const pInfo = document.getElementById("profileInfo");
        if (pInfo) {
            pInfo.innerHTML = `
                <p><span class="label">Öğrenci No:</span> ${user.ogrenci_no}</p>
                <p><span class="label">Ad Soyad:</span> ${user.first_name} ${user.last_name}</p>
                <p><span class="label">E-posta:</span> ${user.email}</p>
             `;
        }

        const inpNo = document.getElementById("profileOgrenciNo");
        const inpName = document.getElementById("profileName");
        const inpSurname = document.getElementById("profileSurname");
        const inpEmail = document.getElementById("profileEmail");

        if (inpNo) inpNo.value = user.ogrenci_no;
        if (inpName) inpName.value = user.first_name;
        if (inpSurname) inpSurname.value = user.last_name;
        if (inpEmail) inpEmail.value = user.email;

    } catch (e) {
        console.error("Profil hatası:", e);
    }
}

async function loadMembershipOverview() {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${API}/members/my/clubs`, {
            headers: { ...authHeader(), "Content-Type": "application/json" },
        });
        if (!res.ok) {
            console.warn("my/clubs alınamadı");
            return;
        }
        const data = await res.json();
        membershipOverview = data;
        updateOverviewUI(data);
    } catch (e) {
        console.error("Üyelik overview hatası:", e);
    }
}

function updateOverviewUI(data) {
    const approved = (data && data.approved) || [];
    const pending = (data && data.pending) || [];

    const statClubsCount = document.getElementById("statClubsCount");
    const statPendingCount = document.getElementById("statPendingCount");
    const statClubsList = document.getElementById("statClubsList");
    const statPendingList = document.getElementById("statPendingList");

    if (statClubsCount) statClubsCount.textContent = approved.length || "-";
    if (statPendingCount) statPendingCount.textContent = pending.length || "-";

    if (statClubsList) {
        if (approved.length === 0) {
            statClubsList.textContent = "Henüz üye olduğunuz kulüp bulunmuyor.";
        } else {
            statClubsList.innerHTML =
                `<ul class="stat-sublist-list">` +
                approved.map((c) => `<li>${c.name}</li>`).join("") +
                `</ul>`;
        }
    }

    if (statPendingList) {
        if (pending.length === 0) {
            statPendingList.textContent = "Bekleyen üyelik başvurunuz bulunmuyor.";
        } else {
            statPendingList.innerHTML =
                `<ul class="stat-sublist-list">` +
                pending.map((c) => `<li>${c.name}</li>`).join("") +
                `</ul>`;
        }
    }
}

// ==============================
// Kulüpleri Listele
// ==============================

async function loadClubs() {
    const container = document.getElementById("clubListContainer");
    if (!container) return;
    try {
        const res = await fetch(`${API}/members/clubs`, { headers: authHeader() });
        const clubs = await res.json();

        if (Array.isArray(clubs) && clubs.length > 0) {
            let html = `<ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">`;
            clubs.forEach((c) => {
                html += `
                <li class="club-item" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <div class="club-name">${c.name}</div>
                        <div class="club-desc">${c.description || ""}</div>
                    </div>
                    <div class="club-actions">
                        <button class="chip club-detail-btn" data-club-id="${c.id}">Detay</button>
                        <button class="chip club-join-btn" data-club-id="${c.id}">Üye Ol</button>
                    </div>
                </li>`;
            });
            html += `</ul>`;
            container.innerHTML = html;
        } else {
            container.textContent = "Henüz kulüp bulunamadı.";
        }
    } catch (e) {
        console.error("Kulüp hatası:", e);
        container.textContent = "Kulüpler yüklenirken bir hata oluştu.";
    }
}

// ==============================
// Kulüp Detayı (Modal)
// ==============================

async function showClubDetail(clubId) {
    const modal = document.getElementById("clubDetailModal");
    const msgEl = document.getElementById("clubJoinMessage");

    currentClubInModal = Number(clubId);

    if (msgEl) {
        msgEl.textContent = "";
        msgEl.className = "status-info";
    }

    try {
        const res = await fetch(`${API}/members/clubs/${clubId}`);
        if (!res.ok) {
            throw new Error("Kulüp detayı alınamadı.");
        }
        const club = await res.json();

        const nameEl = document.getElementById("clubDetailName");
        const descEl = document.getElementById("clubDetailDescription");
        const emailEl = document.getElementById("clubDetailEmail");
        const phoneEl = document.getElementById("clubDetailPhone");
        const missionEl = document.getElementById("clubDetailMission");
        const visionEl = document.getElementById("clubDetailVision");

        if (nameEl) nameEl.textContent = club.name;
        if (descEl) descEl.textContent = club.description;
        if (emailEl) emailEl.textContent = club.email;
        if (phoneEl) phoneEl.textContent = club.phone;
        if (missionEl) missionEl.textContent = club.mission;
        if (visionEl) visionEl.textContent = club.vision;

        const joinBtn = document.getElementById("btnJoinClub");
        if (joinBtn) {
            joinBtn.setAttribute("data-club-id", clubId);
            joinBtn.disabled = false;
            joinBtn.textContent = "Üye Ol";
        }

        const cancelBtn = document.getElementById("btnCancelMembership");
        if (cancelBtn) {
            cancelBtn.style.display = "none";
            cancelBtn.setAttribute("data-club-id", clubId);
        }

        // Fotoğraflar
        const photosEl = document.getElementById("clubDetailPhotos");
        if (photosEl) {
            const photos = CLUB_PHOTOS[Number(clubId)] || [];
            if (photos.length === 0) {
                photosEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Bu kulüp için henüz fotoğraf eklenmemiş.</p>`;
            } else {
                photosEl.innerHTML = photos
                    .map(
                        (file) => `
                        <img src="${CLUB_PHOTO_BASE}${file}" alt="Kulüp etkinlik fotoğrafı" onerror="this.style.display='none';" />
                    `
                    )
                    .join("");
            }
        }

        // Üyelik durumuna göre butonları ayarla
        if (membershipOverview) {
            const approved = membershipOverview.approved || [];
            const pending = membershipOverview.pending || [];
            const isApproved = approved.some((c) => c.club_id === Number(clubId));
            const isPending = pending.some((c) => c.club_id === Number(clubId));

            if (isApproved && joinBtn) {
                joinBtn.disabled = true;
                joinBtn.textContent = "Bu kulübün üyesisiniz";
                if (msgEl) {
                    msgEl.textContent = "Bu kulübün üyesisiniz.";
                    msgEl.className = "status-success";
                }
            } else if (isPending) {
                if (msgEl) {
                    msgEl.textContent = "Bu kulübe zaten başvuru yaptınız.";
                    msgEl.className = "status-warning";
                }
                if (cancelBtn) {
                    cancelBtn.style.display = "inline-flex";
                }
            }
        }

        if (modal) {
            modal.style.display = "flex";
        }
    } catch (err) {
        console.error(err);
        if (msgEl) {
            msgEl.textContent = "Kulüp detayları yüklenirken bir hata oluştu.";
            msgEl.className = "status-error";
        }
        if (modal) {
            modal.style.display = "flex";
        }
    }
}

// ==============================
// Kulübe Üye Ol
// ==============================

async function joinClub(clubId) {
    const msgEl = document.getElementById("clubJoinMessage");
    const token = getToken();
    const cancelBtn = document.getElementById("btnCancelMembership");
    const joinBtn = document.getElementById("btnJoinClub");

    if (!msgEl) return;

    msgEl.className = "status-info";
    msgEl.textContent = "";

    if (!token) {
        msgEl.textContent = "Üye olmak için önce giriş yapmalısınız.";
        msgEl.className = "status-error";
        return;
    }

    try {
        const res = await fetch(`${API}/members/clubs/${clubId}/join`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeader(),
            },
        });

        let data = {};
        try {
            data = await res.json();
        } catch (_) {}

        if (res.ok) {
            msgEl.textContent = data.message || "Üyelik başvurunuz başarıyla alınmıştır.";
            msgEl.className = "status-success";
            if (cancelBtn) cancelBtn.style.display = "inline-flex";
            await loadMembershipOverview();
        } else if (res.status === 400) {
            msgEl.textContent = data.detail || "Bu kulübe zaten başvurunuz bulunuyor.";
            msgEl.className = "status-warning";
            if (data.detail && data.detail.includes("başvuru yaptınız")) {
                if (cancelBtn) cancelBtn.style.display = "inline-flex";
            }
        } else if (res.status === 404) {
            msgEl.textContent = "Kulüp bulunamadı.";
            msgEl.className = "status-error";
        } else {
            msgEl.textContent =
                data.detail ||
                "Üyelik başvurunuz şu anda tamamlanamadı, lütfen tekrar deneyin.";
            msgEl.className = "status-error";
        }
    } catch (err) {
        console.error(err);
        msgEl.textContent =
            "Üyelik başvurunuz şu anda tamamlanamadı, lütfen tekrar deneyin.";
        msgEl.className = "status-error";
    } finally {
        // Sayfa değişimi yok, modal açık kalıyor
        if (joinBtn) joinBtn.blur();
    }
}

// ==============================
// Üyelik Başvurusunu Geri Çek
// ==============================

async function cancelMembership(clubId) {
    const msgEl = document.getElementById("clubJoinMessage");
    const cancelBtn = document.getElementById("btnCancelMembership");
    const token = getToken();

    if (!msgEl) return;

    msgEl.className = "status-info";

    if (!token) {
        msgEl.textContent = "İşlem için tekrar giriş yapmanız gerekiyor.";
        msgEl.className = "status-error";
        return;
    }

    try {
        const res = await fetch(`${API}/members/clubs/${clubId}/join`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...authHeader(),
            },
        });

        let data = {};
        try {
            data = await res.json();
        } catch (_) {}

        if (res.ok) {
            msgEl.textContent = data.message || "Üyelik başvurunuz geri çekildi.";
            msgEl.className = "status-success";
            if (cancelBtn) cancelBtn.style.display = "none";
            await loadMembershipOverview();
        } else {
            msgEl.textContent =
                data.detail ||
                "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
            msgEl.className = "status-error";
        }
    } catch (err) {
        console.error(err);
        msgEl.textContent =
            "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
        msgEl.className = "status-error";
    }
}
