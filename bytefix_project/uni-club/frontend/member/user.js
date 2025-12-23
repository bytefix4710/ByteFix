const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "memberToken";
let MODAL_OPEN = false;
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
// Helpers
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

function getActivePage() {
  const active = document.querySelector(".page-view.active");
  if (!active || !active.id) return "overview";
  return active.id.replace("page-", "");
}

// ==============================
// DOMContentLoaded
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Sayfa yüklendi, User.js devrede!");

  // ------- REGISTER -------
  const btnRegister = document.getElementById("btnRegister");
  if (btnRegister) {
    btnRegister.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

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
        if (!res.ok) throw new Error(data.detail || "Kayıt başarısız.");

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

  // ------- LOGIN -------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

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

  // ------- DASHBOARD INIT -------
  if (document.getElementById("page-overview")) {
    console.log("✅ Dashboard yüklendi.");
    loadProfile();
    loadClubs();
    loadMembershipOverview();
    loadOverviewAnnouncements();
    loadOverviewEvents();
  }

  // ------- GLOBAL CLICK HANDLER (Kulüp listesi) -------
  document.addEventListener("click", async (e) => {
    const detailBtn = e.target.closest(".club-detail-btn");
    if (detailBtn) {
      e.preventDefault();
      e.stopPropagation();
      const clubId = detailBtn.getAttribute("data-club-id");
      if (clubId) await showClubDetail(clubId);
      return;
    }

    const joinRowBtn = e.target.closest(".club-join-btn");
    if (joinRowBtn) {
      // ❌ Eskisi: showClubDetail + joinClub => bug + UX sorun
      // ✅ Yenisi: sadece modal aç
      e.preventDefault();
      e.stopPropagation();

      const clubId = joinRowBtn.getAttribute("data-club-id");
      if (clubId) await showClubDetail(clubId);
      return;
    }
  });

  // ------- MODAL BUTTONS -------
  const joinBtn = document.getElementById("btnJoinClub");
  if (joinBtn) {
    joinBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clubId = joinBtn.getAttribute("data-club-id") || currentClubInModal;
      if (clubId) await joinClub(clubId);
    });
  }

  const cancelBtn = document.getElementById("btnCancelMembership");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clubId = cancelBtn.getAttribute("data-club-id") || currentClubInModal;
      if (clubId) await cancelMembership(clubId);
    });
  }

  // ------- MODAL CLOSE / STOP PROPAGATION -------
  const closeBtn = document.getElementById("btnCloseClubModal");
  const modal = document.getElementById("clubDetailModal");
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  modal.style.display = "none";
document.body.classList.remove("modal-open");
MODAL_OPEN = false; // 🔥 KİLİT AÇ
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
document.body.classList.remove("modal-open");
MODAL_OPEN = false; // 🔥 KİLİT AÇ
  }
});


    // modal card içi tıklamalar overlay'e / sayfaya taşmasın
    const modalCard = document.querySelector("#clubDetailModal .modal-card");
    if (modalCard) {
      modalCard.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
  }
});

// ==============================
// Page Routing
// ==============================
function showPage(pageName) {
      if (MODAL_OPEN) {
    console.log("⛔ Modal açıkken routing iptal edildi");
    return;
  }
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.remove("active");
  });

  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.classList.remove("active");
  });

  const pageView = document.getElementById(`page-${pageName}`);
  if (pageView) pageView.classList.add("active");

  const sidebarItem = document.querySelector(`[data-page="${pageName}"]`);
  if (sidebarItem) sidebarItem.classList.add("active");

  if (pageName === "overview") {
    loadProfile();
    loadMembershipOverview();
    loadOverviewAnnouncements();
    loadOverviewEvents();
  } else if (pageName === "clubs") {
    loadClubs();
  } else if (pageName === "events") {
    loadEvents();
  }
}
window.showPage = showPage;

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
// Kulüpler
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
// Kulüp Detayı Modal
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
    if (!res.ok) throw new Error("Kulüp detayı alınamadı.");
    const club = await res.json();

    const nameEl = document.getElementById("clubDetailName");
    const descEl = document.getElementById("clubDetailDescription");
    const emailEl = document.getElementById("clubDetailEmail");
    const phoneEl = document.getElementById("clubDetailPhone");
    const missionEl = document.getElementById("clubDetailMission");
    const visionEl = document.getElementById("clubDetailVision");

    if (nameEl) nameEl.textContent = club.name || "";
    if (descEl) descEl.textContent = club.description || "";
    if (emailEl) emailEl.textContent = club.email || "";
    if (phoneEl) phoneEl.textContent = club.phone || "";
    if (missionEl) missionEl.textContent = club.mission || "";
    if (visionEl) visionEl.textContent = club.vision || "";

    await loadClubEventsIntoModal(clubId);

    const joinBtn = document.getElementById("btnJoinClub");
    const cancelBtn = document.getElementById("btnCancelMembership");

    if (joinBtn) {
      joinBtn.setAttribute("data-club-id", clubId);
      joinBtn.disabled = false;
      joinBtn.textContent = "Üye Ol";
    }

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
          .map((file) => `<img src="${CLUB_PHOTO_BASE}${file}" alt="Kulüp etkinlik fotoğrafı" onerror="this.style.display='none';" />`)
          .join("");
      }
    }

    // Üyelik durumu
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
        if (cancelBtn) cancelBtn.style.display = "inline-flex";
      }
    }

   if (modal) {
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
  MODAL_OPEN = true; // 🔥 KİLİT
}
  } catch (err) {
    console.error(err);
    if (msgEl) {
      msgEl.textContent = "Kulüp detayları yüklenirken bir hata oluştu.";
      msgEl.className = "status-error";
    }
    if (modal) {
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
  MODAL_OPEN = true; // 🔥 KİLİT
}
  }
}


// ==============================
// Kulübe Üye Ol / Geri çek
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

  const activePage = getActivePage();

  try {
    const res = await fetch(`${API}/members/clubs/${clubId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

   if (res.ok) {
  msgEl.textContent = data.message || "Üyelik başvurunuz alındı.";
  msgEl.className = "status-success";

  if (cancelBtn) cancelBtn.style.display = "inline-flex";

  await loadMembershipOverview(); // ✅ sadece data güncelle
  // ❌ showPage YOK
}else if (res.status === 400) {
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
        data.detail || "Üyelik başvurunuz şu anda tamamlanamadı, lütfen tekrar deneyin.";
      msgEl.className = "status-error";
    }
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Üyelik başvurunuz şu anda tamamlanamadı, lütfen tekrar deneyin.";
    msgEl.className = "status-error";
  } finally {
    if (joinBtn) joinBtn.blur();
  }
}

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

  const activePage = getActivePage();

  try {
    const res = await fetch(`${API}/members/clubs/${clubId}/join`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

    if (res.ok) {
  msgEl.textContent = data.message || "Başvuru geri çekildi.";
  msgEl.className = "status-success";

  if (cancelBtn) cancelBtn.style.display = "none";

  await loadMembershipOverview(); // ✅ sadece overview güncelle
  // ❌ showPage YOK
}
 else {
      msgEl.textContent =
        data.detail || "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
      msgEl.className = "status-error";
    }
  } catch (err) {
    console.error(err);
    msgEl.textContent =
      "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
    msgEl.className = "status-error";
  }
}

// ==============================
// Events Page
// ==============================
async function loadEvents() {
  const container = document.getElementById("eventsListContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API}/members/events`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) {
      container.innerHTML = `
        <div style="font-size:13px; color:var(--text-muted);">
          Şu an listelenecek etkinlik yok.
        </div>`;
      return;
    }

    const now = new Date();

    // ---------- 1) SIRALAMA: önce upcoming sonra past ----------
    const upcoming = events.filter(ev => new Date(ev.datetime) > now);
    const past = events.filter(ev => new Date(ev.datetime) <= now);

    upcoming.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)); // yakın tarih üstte
    past.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));    // en yeni geçmiş üstte

    const sortedEvents = [...upcoming, ...past];

    // ---------- 2) KULÜP FİLTRESİ UI (dropdown) ----------
    // container içine üstte filter alanı ekliyoruz (varsa tekrar eklemeyelim)
    const uniqueClubs = Array.from(
      new Set(sortedEvents.map(e => (e.kulup_name || "").trim()).filter(Boolean))
    );

    const filterHtml = `
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        <div class="label" style="margin:0;">Kulübe göre filtrele:</div>
        <select id="eventClubFilter" style="min-width:220px;">
          <option value="all">Tüm Kulüpler</option>
          ${uniqueClubs.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
        </select>
      </div>
      <div id="eventsListInner"></div>
    `;

    container.innerHTML = filterHtml;

    const inner = document.getElementById("eventsListInner");
    const filterEl = document.getElementById("eventClubFilter");

    // ---------- 3) RENDER FONKSİYONU ----------
    const renderEvents = (list) => {
      if (!inner) return;

      if (!Array.isArray(list) || list.length === 0) {
        inner.innerHTML = `
          <div style="font-size:13px; color:var(--text-muted);">
            Bu filtreye uygun etkinlik yok.
          </div>`;
        return;
      }

      let html = `<div style="display:flex; flex-direction:column; gap:10px;">`;

      list.forEach((ev) => {
        const evDate = new Date(ev.datetime);
        const isFuture = evDate > now;

        // --- kontenjan / doluluk (fallback'li) ---
        const capacity =
          ev.capacity ?? ev.kontenjan ?? null; // backend capacity veya kontenjan dönüyorsa
        const regCount =
          ev.registered_count ?? ev.kayit_sayisi ?? ev.register_count ?? null;

        const hasCapacity = typeof capacity === "number" && capacity >= 0;
        const hasRegCount = typeof regCount === "number" && regCount >= 0;

        const isFull = hasCapacity && hasRegCount ? regCount >= capacity : false;

        let capacityHtml = "";
        if (hasCapacity && hasRegCount) {
          capacityHtml = `
            <div class="club-desc" style="margin-top:6px;">
              Kontenjan: <b>${regCount} / ${capacity}</b>
              ${isFull ? `<span class="chip" style="margin-left:8px;">Dolu</span>` : ``}
            </div>
          `;
        } else if (hasCapacity) {
          capacityHtml = `
            <div class="club-desc" style="margin-top:6px;">
              Kontenjan: <b>${capacity}</b>
            </div>
          `;
        }

        // --- buton mantığı ---
        let actionHtml = "";
        if (isFuture) {
          if (isFull && !ev.registered) {
            actionHtml = `<span class="chip">Kontenjan Dolu</span>`;
          } else if (ev.registered) {
            actionHtml = `
              <button class="button-ghost button-small"
                onclick="cancelEvent(${ev.etkinlik_id}); event.stopPropagation();">
                Başvurunu Geri Çek
              </button>
            `;
          } else {
            actionHtml = `
              <button class="button-primary button-small"
                onclick="registerEvent(${ev.etkinlik_id}); event.stopPropagation();">
                Kayıt Ol
              </button>
            `;
          }
        } else {
          actionHtml = `<span class="chip">Etkinlik Geçmiş</span>`;
        }

        html += `
          <div class="club-item" style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div style="flex:1;">
              <div class="club-name">${escapeHtml(ev.name || "")}</div>

              <div class="club-desc" style="margin-top:4px;">
                <b>${escapeHtml(ev.kulup_name || "")}</b> • ${evDate.toLocaleString("tr-TR")}
              </div>
            
              <div class="club-desc" style="margin-top:4px; display:flex; gap:8px; align-items:center;">
  ${ev.capacity != null ? `<span class="chip">Kontenjan: ${ev.capacity}</span>` : `<span class="chip">Kontenjan: -</span>`}
  ${ev.is_full ? `<span class="chip" style="opacity:.9;">Dolu</span>` : `<span class="chip" style="opacity:.9;">Açık</span>`}
</div>

              <div class="club-desc" style="margin-top:6px;">
                ${escapeHtml(ev.description || "")}
              </div>

              ${capacityHtml}

              <div id="eventMsg-${ev.etkinlik_id}" style="margin-top:8px; font-size:13px;"></div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
              ${actionHtml}
            </div>
          </div>
        `;
      });

      html += `</div>`;
      inner.innerHTML = html;
    };

    // ilk render
    renderEvents(sortedEvents);

    // filtre change
    if (filterEl) {
      filterEl.addEventListener("change", () => {
        const selected = filterEl.value;
        if (selected === "all") {
          renderEvents(sortedEvents);
        } else {
          renderEvents(sortedEvents.filter(e => (e.kulup_name || "").trim() === selected));
        }
      });
    }
  } catch (e) {
    console.error("Etkinlik yükleme hatası:", e);
    container.textContent = "Etkinlikler yüklenirken hata oluştu.";
  }
}

// XSS/HTML kırılmasın diye minik helper
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function registerEvent(eventId) {
  const msgEl = document.getElementById(`eventMsg-${eventId}`);
  if (msgEl) {
    msgEl.textContent = "";
    msgEl.className = "status-info";
  }

  try {
    const res = await fetch(`${API}/members/events/${eventId}/register`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    let data = {};
    try { data = await res.json(); } catch (_) {}

    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = data.message || "Başarıyla kaydoldunuz";
        msgEl.className = "status-success";
      }
      await loadEvents();
      await loadOverviewEvents(); // overview da güncellensin
    } else if (res.status === 400) {
      if (msgEl) {
        msgEl.textContent = data.detail || "İşlem başarısız.";
        msgEl.className = "status-warning";
      }
    } else {
      if (msgEl) {
        msgEl.textContent = data.detail || "Kayıt sırasında hata oluştu.";
        msgEl.className = "status-error";
      }
    }
  } catch (e) {
    console.error(e);
    if (msgEl) {
      msgEl.textContent = "Kayıt sırasında hata oluştu.";
      msgEl.className = "status-error";
    }
  }
}

async function cancelEvent(eventId) {
  const msgEl = document.getElementById(`eventMsg-${eventId}`);
  if (msgEl) {
    msgEl.textContent = "";
    msgEl.className = "status-info";
  }

  try {
    const res = await fetch(`${API}/members/events/${eventId}/register`, {
      method: "DELETE",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    let data = {};
    try { data = await res.json(); } catch (_) {}

    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = data.message || "Başvurunuz geri çekildi.";
        msgEl.className = "status-success";
      }
      await loadEvents();
      await loadOverviewEvents();
    } else {
      if (msgEl) {
        msgEl.textContent = data.detail || "Geri çekme sırasında hata oluştu.";
        msgEl.className = "status-error";
      }
    }
  } catch (e) {
    console.error(e);
    if (msgEl) {
      msgEl.textContent = "Geri çekme sırasında hata oluştu.";
      msgEl.className = "status-error";
    }
  }
}

window.registerEvent = registerEvent;
window.cancelEvent = cancelEvent;

// ==============================
// Club Modal Events (Upcoming / Past)
// ==============================
async function loadClubEventsIntoModal(clubId) {
  const upcomingEl = document.getElementById("clubUpcomingEvents");
  const pastEl = document.getElementById("clubPastEvents");

  if (upcomingEl) upcomingEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Yükleniyor...</p>`;
  if (pastEl) pastEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Yükleniyor...</p>`;

  try {
    const res = await fetch(`${API}/members/clubs/${clubId}/events`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    if (!res.ok) {
      if (upcomingEl) upcomingEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Etkinlik bilgisi alınamadı.</p>`;
      if (pastEl) pastEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Etkinlik bilgisi alınamadı.</p>`;
      return;
    }

    const data = await res.json();
    const upcoming = data.upcoming || [];
    const past = data.past || [];

    if (upcomingEl) {
      if (upcoming.length === 0) {
        upcomingEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Yaklaşan etkinlik yok.</p>`;
      } else {
        upcomingEl.innerHTML = upcoming.map((ev) => {
          const d = new Date(ev.datetime);
          return `
            <div class="chip" style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
              <div style="font-weight:600;">${ev.name}</div>
              <div style="font-size:12px; opacity:0.8;">${d.toLocaleString("tr-TR")}</div>
            </div>
          `;
        }).join("");
      }
    }

    if (pastEl) {
      if (past.length === 0) {
        pastEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Geçmiş etkinlik yok.</p>`;
      } else {
        const sliced = past.slice(0, 5);
        pastEl.innerHTML = sliced.map((ev) => {
          const d = new Date(ev.datetime);
          return `
            <div class="chip" style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
              <div style="font-weight:600;">${ev.name}</div>
              <div style="font-size:12px; opacity:0.8;">${d.toLocaleString("tr-TR")}</div>
            </div>
          `;
        }).join("");
      }
    }
  } catch (e) {
    console.error("Kulüp event modal hatası:", e);
    if (upcomingEl) upcomingEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Hata oluştu.</p>`;
    if (pastEl) pastEl.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">Hata oluştu.</p>`;
  }
}

// ==============================
// Overview - Announcements
// ==============================
async function loadOverviewAnnouncements() {
  const el = document.getElementById("overviewAnnouncements");
  if (!el) return;

  el.innerHTML = `<p style="font-size:13px; color: var(--text-muted);">Yükleniyor...</p>`;

  try {
    const res = await fetch(`${API}/members/announcements`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    if (!res.ok) {
      el.innerHTML = `<p style="font-size:13px; color: var(--text-muted);">Duyurular alınamadı.</p>`;
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      el.innerHTML = `<p style="font-size:13px; color: var(--text-muted);">Henüz yeni bir duyuru yok.</p>`;
      return;
    }

    el.innerHTML = data.map((a) => {
  const dateTxt = a.created_at ? new Date(a.created_at).toLocaleString("tr-TR") : "";
  const meta = `${a.kulup_name || ""}${dateTxt ? " • " + dateTxt : ""}`;

  return `
    <button class="announcement-btn"
            data-title="${escapeHtml(a.title)}"
            data-meta="${escapeHtml(meta)}"
            data-desc="${escapeHtml(a.description)}">
      <div class="announcement-title">${escapeHtml(a.title)}</div>
      <div class="announcement-meta">${escapeHtml(meta)}</div>
      <div class="announcement-preview">${escapeHtml(a.description)}</div>
    </button>
  `;
}).join("");

  } catch (e) {
    console.error(e);
    el.innerHTML = `<p style="font-size:13px; color: var(--text-muted);">Hata oluştu.</p>`;
  }
}

// ==============================
// Overview - Events (Top 5 upcoming)
// ==============================
async function loadOverviewEvents() {
  const ph = document.getElementById("overviewEventsPlaceholder");
  const listEl = document.getElementById("overviewEventsList");
  if (!listEl) return;

  listEl.innerHTML = "";
  if (ph) ph.textContent = "Yükleniyor...";

  try {
    const res = await fetch(`${API}/members/events`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      if (ph) ph.textContent = "Etkinlikler alınamadı.";
      return;
    }

    const now = new Date();
    const upcoming = data.filter((x) => new Date(x.datetime) > now).slice(0, 5);

    if (upcoming.length === 0) {
      if (ph) ph.textContent = "Yakında katılabileceğin etkinlik yok.";
      return;
    }

    if (ph) ph.textContent = "";

    listEl.innerHTML = upcoming.map((ev) => {
      const d = new Date(ev.datetime);
      return `
        <div class="chip" style="display:flex; flex-direction:column; align-items:flex-start; gap:2px; margin-top:8px;">
          <div style="font-weight:700;">${ev.name}</div>
          <div style="font-size:12px; opacity:.8;">${ev.kulup_name || ""} • ${d.toLocaleString("tr-TR")}</div>
          <div style="font-size:12px; opacity:.9;">${ev.description || ""}</div>
        </div>
      `;
    }).join("");
  } catch (e) {
    console.error(e);
    if (ph) ph.textContent = "Hata oluştu.";
  }
}

function loadOverviewAnnouncements() {
  const el = document.getElementById("overviewAnnouncements");
  if (!el) return;

  // 🔥 GEÇİCİ DUMMY DATA (BACKEND YOK SAYILDI)
  const announcements = [
    {
      title: "Yeni Dönem Atölye Takvimi",
      kulup_name: "Bilgisayar Mühendisliği Kulübü",
      description:
        "Yeni dönem için Python, Yapay Zeka ve Backend atölyeleri planlanıyor. Takvim bu hafta paylaşılacak.",
      created_at: "2 gün önce",
    },
    {
      title: "Kulüp Toplantısı",
      kulup_name: "Bilgisayar Mühendisliği Kulübü",
      description:
        "18 Aralık Salı 17:30'da B-201'de dönem planlama toplantısı yapılacaktır.",
      created_at: "1 gün önce",
    },
    {
      title: "Fotoğraf Gezisi Başvuruları",
      kulup_name: "Fotoğrafçılık Kulübü",
      description:
        "Hafta sonu şehir içi fotoğraf gezisi düzenlenecek. Katılım için duyuru altındaki formu doldurun.",
      created_at: "3 gün önce",
    },
    {
      title: "Portre Workshop Kayıtları Açıldı",
      kulup_name: "Fotoğrafçılık Kulübü",
      description:
        "Portre fotoğrafçılığı workshop'u için kayıtlar açıldı. Kontenjan 20 kişi ile sınırlıdır.",
      created_at: "1 gün önce",
    },
    {
      title: "Bahar Konseri Seçmeleri",
      kulup_name: "Müzik Kulübü",
      description:
        "Bahar konserinde sahne alacak öğrenci grupları için seçmeler başlıyor.",
      created_at: "4 gün önce",
    },
    {
      title: "Yeni Enstrüman Dersleri",
      kulup_name: "Müzik Kulübü",
      description:
        "Gitar ve bateri dersleri için yeni kontenjan açılmıştır.",
      created_at: "2 gün önce",
    },
  ];

  // 🔥 EKRANA BAS
  el.innerHTML = announcements
    .map(
      (a) => `
      <div class="chip" style="
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:4px;
        margin-top:10px;
        padding:10px;
      ">
        <div style="font-weight:700;">${a.title}</div>
        <div style="font-size:12px; opacity:.75;">
          ${a.kulup_name} • ${a.created_at}
        </div>
        <div style="font-size:13px; opacity:.9;">
          ${a.description}
        </div>
      </div>
    `
    )
    .join("");
}
