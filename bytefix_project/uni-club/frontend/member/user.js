const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "memberToken";
let MODAL_OPEN = false;

// 🔥 PAGE LOCK: Prevents unwanted navigation to overview after actions
// Using localStorage to persist lock across page reloads
const PAGE_LOCK_KEY = "__page_lock__";
const PAGE_LOCK_UNTIL_KEY = "__page_lock_until__";
const LOCKED_PAGE_KEY = "__locked_page__";

function setPageLock(pageName, durationMs = 1000) {
  localStorage.setItem(PAGE_LOCK_KEY, "true");
  localStorage.setItem(PAGE_LOCK_UNTIL_KEY, String(Date.now() + durationMs));
  localStorage.setItem(LOCKED_PAGE_KEY, pageName);
  console.log(`🔒 PAGE LOCK aktif: ${pageName} sayfası ${durationMs}ms süreyle kilitlendi`);
}

function clearPageLock() {
  localStorage.removeItem(PAGE_LOCK_KEY);
  localStorage.removeItem(PAGE_LOCK_UNTIL_KEY);
  localStorage.removeItem(LOCKED_PAGE_KEY);
  console.log('🔓 PAGE LOCK kaldırıldı');
}

function isPageLocked() {
  const lock = localStorage.getItem(PAGE_LOCK_KEY);
  const until = localStorage.getItem(PAGE_LOCK_UNTIL_KEY);

  if (!lock || !until) return false;

  const now = Date.now();
  const lockUntil = parseInt(until, 10);

  if (now >= lockUntil) {
    clearPageLock();
    return false;
  }

  return true;
}

function getLockedPage() {
  return localStorage.getItem(LOCKED_PAGE_KEY);
}
// Kulüp foto mapping (id -> dosya listesi)
// Dosyalar: frontend/assets/clubs/
const CLUB_PHOTOS = {
  1: ["bilmuh_1.jpg", "bilmuh_2.jpg", "bilmuh_3.jpg", "bilmuh_4.jpg"],
  2: ["foto_1.jpg", "foto_2.jpg", "foto_3.jpg", "foto_4.jpg"],
  3: ["muzik_1.jpg", "muzik_2.jpg", "muzik_3.jpg", "muzik_4.jpg"],
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
// Centralized Event Permission Check
// ==============================
/**
 * Check if user can register to an event based on club membership status
 * @param {number} clubId - The club ID for the event
 * @returns {Object} { canRegister: boolean, status: 'approved'|'pending'|'none', message: string }
 */
function canRegisterToEvent(clubId) {
  if (!membershipOverview || !clubId) {
    return { canRegister: false, status: 'none', message: 'Üye Değilsiniz' };
  }

  const approved = membershipOverview.approved || [];
  const pending = membershipOverview.pending || [];

  const isApproved = approved.some(c => c.club_id === Number(clubId));
  const isPending = pending.some(c => c.club_id === Number(clubId));

  if (isApproved) {
    return { canRegister: true, status: 'approved', message: '' };
  } else if (isPending) {
    return { canRegister: false, status: 'pending', message: 'Üyelik Onay Bekliyor' };
  } else {
    return { canRegister: false, status: 'none', message: 'Üye Değilsiniz' };
  }
}

// Expose to window for use in event_overlay.js
window.canRegisterToEvent = canRegisterToEvent;


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

    // Load initial data for overview page (which is active by default in HTML)
    loadProfile();
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

  // 🔥 PAGE LOCK: Block navigation to overview during actions
  if (isPageLocked()) {
    const lockedPage = getLockedPage();
    if (pageName === 'overview' && lockedPage && lockedPage !== 'overview') {
      console.log(`⛔ PAGE LOCK aktif: overview'a geçiş engellendi, ${lockedPage} sayfasında kalınıyor`);
      return;
    }
  }

  // DEBUG: Trace showPage calls
  console.log("[showPage]", pageName, "active:", typeof getActivePage === 'function' ? getActivePage() : 'N/A');
  console.log(new Error("showPage stack").stack);

  // 1. Hide all pages
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.remove("active");
    view.style.display = "none"; // JS Force Hide
    view.style.visibility = "hidden"; // Extra safety
    view.style.height = "0";
    view.style.overflow = "hidden";
  });

  // 2. Deactivate sidebar items
  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.classList.remove("active");
  });

  // 3. Show target page
  const pageView = document.getElementById(`page-${pageName}`);
  if (pageView) {
    pageView.classList.add("active");
    // JS Force Show
    pageView.style.display = "block";
    pageView.style.visibility = "visible";
    pageView.style.height = "auto";
    pageView.style.overflow = "visible";
  } else {
    console.error(`❌ Sayfa bulunamadı: page-${pageName}`);
  }

  // 4. Activate sidebar item
  const sidebarItem = document.querySelector(`[data-page="${pageName}"]`);
  if (sidebarItem) sidebarItem.classList.add("active");

  // 5. Load data
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

// Helper function to get the currently active page
function getActivePage() {
  const activePage = document.querySelector('.page-view.active');
  if (activePage) {
    const id = activePage.id; // e.g., "page-events"
    return id.replace('page-', '');
  }
  return null;
}

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

    const wName = document.getElementById("userWelcomeName");
    if (wName) wName.textContent = user.first_name || user.email.split("@")[0];

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
    window.membershipOverview = data; // Make it globally accessible
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

  if (statClubsCount) statClubsCount.textContent = approved.length;
  if (statPendingCount) statPendingCount.textContent = pending.length;

  const renderList = (list) => {
    if (list.length === 0) return `<div style="font-size: 12px; color: var(--text-muted); padding-top: 4px; padding-left: 16px;">Liste boş</div>`;
    const visible = list.slice(0, 3);
    const hiddenCount = list.length - visible.length;

    let html = `<ul style="list-style: none; padding: 0 0 0 16px; margin-top: 8px; font-size: 13px; color: var(--text-muted);">`;
    html += visible.map(c =>
      `<li style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">• ${escapeHtml(c.name)}</li>`
    ).join("");

    if (hiddenCount > 0) {
      html += `<li style="font-size: 11px; opacity: 0.7; margin-top: 4px;">+ ${hiddenCount} kulüp daha</li>`;
    }
    html += `</ul>`;
    return html;
  };

  if (statClubsList) statClubsList.innerHTML = renderList(approved);
  if (statPendingList) statPendingList.innerHTML = renderList(pending);
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
      // Use Grid layout similar to Super Admin
      let html = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">`;
      clubs.forEach((c) => {
        html += `
          <div class="card-fancy">
            <div class="card-fancy-bg"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; position: relative; z-index: 1;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span style="font-size: 24px;">🏛️</span>
                  <div class="text-gradient" style="font-size: 18px; font-weight: 700;">${escapeHtml(c.name)}</div>
                </div>
              </div>
            </div>

            ${c.image_url ? `
            <div style="margin-bottom: 16px; border-radius: var(--radius-lg); overflow: hidden; height: 160px;">
                <img src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.name)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />
            </div>` : ""}

            <div class="desc-box">
               <p>${escapeHtml(c.description || "Açıklama bulunmuyor.")}</p>
            </div>

            <div style="margin-top: auto; display: flex; gap: 10px; justify-content: flex-end; position: relative; z-index: 1;">
               <button type="button" class="button-ghost button-small" onclick="showClubDetail('${c.id}'); event.preventDefault();">Detaylar</button>
               <button type="button" class="button-primary button-small" onclick="showClubDetail('${c.id}'); event.preventDefault();">Kulübü İncele</button>
            </div>
          </div>`;
      });
      html += `</div>`;
      container.innerHTML = html;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
           Henüz kulüp bulunamadı.
        </div>`;
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

    // Mission with fallback
    if (missionEl) {
      const missionText = club.mission && club.mission.length > 50
        ? club.mission
        : "Kulübümüz, öğrencilerin ilgi alanlarında gelişmelerine katkı sağlamak, sosyal ve akademik becerilerini artırmak için çeşitli etkinlikler, atölyeler ve projeler düzenlemektedir. Öğrencilerimizin kendilerini ifade edebilecekleri, yeni arkadaşlıklar kurabileceği ve deneyim kazanabileceği bir ortam sunmayı hedefliyoruz.";
      missionEl.textContent = missionText;
    }

    // Vision with fallback
    if (visionEl) {
      const visionText = club.vision && club.vision.length > 50
        ? club.vision
        : "Üniversitemizin en aktif ve yenilikçi öğrenci topluluklarından biri olmak, ulusal ve uluslararası platformlarda başarılar elde ederek üniversitemizi temsil etmek. Öğrencilerimize kaliteli eğitim ve deneyim fırsatları sunarak, geleceğin lider bireylerini yetiştirmeye katkıda bulunmak.";
      visionEl.textContent = visionText;
    }

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
          .map((file) => `<img src="${CLUB_PHOTO_BASE}${file}" alt="Kulüp etkinlik fotoğrafı" onclick="showPhotoLightbox('${CLUB_PHOTO_BASE}${file}')" style="cursor: pointer;" onerror="this.style.display='none';" />`)
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
  console.log('🔵 joinClub başladı, clubId:', clubId);

  // Save current page before action
  const currentPage = getActivePage();
  setPageLock(currentPage, 1000);

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
      headers: { "Content-Type": "application/json", ...authHeader() },
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) { }

    if (res.ok) {
      msgEl.textContent = data.message || "Üyelik başvurunuz alındı.";
      msgEl.className = "status-success";
      showToast(data.message || "Başvurunuz başarıyla alındı.", "success");

      // Refresh membership cache and update modal state
      await loadMembershipOverview();

      // Update button states based on new membership status
      const clubIdNum = Number(clubId);
      if (membershipOverview) {
        const approved = membershipOverview.approved || [];
        const pending = membershipOverview.pending || [];

        const isApproved = approved.some(c => c.club_id === clubIdNum);
        const isPending = pending.some(c => c.club_id === clubIdNum);

        if (isApproved) {
          if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.textContent = "Bu kulübün üyesisiniz";
          }
          if (cancelBtn) cancelBtn.style.display = "none";
        } else if (isPending) {
          if (joinBtn) {
            joinBtn.textContent = "Başvuru Yapıldı";
            joinBtn.disabled = true;
          }
          if (cancelBtn) cancelBtn.style.display = "inline-flex";
        }
      }

      // Restore page if it changed
      setTimeout(() => {
        const newPage = getActivePage();
        if (newPage !== currentPage && currentPage) {
          showPage(currentPage);
        }
      }, 100);

      console.log('✅ joinClub başarılı, modal state güncellendi');
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
  console.log('🔴 cancelMembership başladı, clubId:', clubId);

  // Save current page before action
  const currentPage = getActivePage();
  setPageLock(currentPage, 1000);

  const msgEl = document.getElementById("clubJoinMessage");
  const cancelBtn = document.getElementById("btnCancelMembership");
  const token = getToken();

  msgEl.className = "status-info";

  if (!token) {
    msgEl.textContent = "İşlem için tekrar giriş yapmanız gerekiyor.";
    msgEl.className = "status-error";
    return;
  }

  try {
    const res = await fetch(`${API}/members/clubs/${clubId}/join`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) { }

    if (res.ok) {
      msgEl.textContent = data.message || "Başvuru geri çekildi.";
      msgEl.className = "status-success";
      showToast(data.message || "Başvurunuz başarıyla geri çekildi.", "success");

      // Refresh membership cache and update modal state
      await loadMembershipOverview();

      // Reset button states
      if (cancelBtn) cancelBtn.style.display = "none";
      const joinBtn = document.getElementById("btnJoinClub");
      if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.textContent = "Üye Ol";
      }

      // Restore page if it changed
      setTimeout(() => {
        const newPage = getActivePage();
        if (newPage !== currentPage && currentPage) {
          showPage(currentPage);
        }
      }, 100);

      console.log('✅ cancelMembership başarılı, modal state güncellendi');
    } else {
      msgEl.textContent = data.detail || "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
      msgEl.className = "status-error";
    }
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Başvuruyu geri çekerken bir hata oluştu, lütfen tekrar deneyin.";
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
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:20px; padding: 16px; background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
        <span style="font-size: 20px;">🔍</span>
        <div class="label" style="margin:0; font-weight: 600; color: var(--text-main);">Kulübe göre filtrele:</div>
        <select id="eventClubFilter" style="min-width:220px; max-width: 300px;">
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

        // --- kontenjan / doluluk (API'den gelen remaining_quota kullan) ---
        const capacity = ev.capacity ?? null;
        const remainingQuota = ev.remaining_quota ?? null;
        const isFull = ev.is_full || false;

        const hasCapacity = typeof capacity === "number" && capacity >= 0;
        const hasRemaining = typeof remainingQuota === "number" && remainingQuota >= 0;

        // Kontenjan bilgisi HTML
        let quotaHtml = "";

        // Sadece gelecek etkinlikler için kontenjan göster
        if (isFuture) {
          if (hasCapacity && hasRemaining) {
            const statusBadge = remainingQuota === 0
              ? `<span class="badge-outlined danger">Dolu</span>`
              : `<span class="badge-outlined success">Yer Var</span>`;

            quotaHtml = `
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
                 <span class="badge-outlined muted">Kalan: ${remainingQuota} / Toplam: ${capacity}</span>
                 ${statusBadge}
              </div>
            `;
          } else if (hasCapacity) {
            quotaHtml = `
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
                 <span class="badge-outlined muted">Kontenjan: ${capacity}</span>
              </div>
            `;
          }
        } else {
          // Geçmiş etkinlikler için kontenjan gösterme, sadece "sona erdi" etiketi
          quotaHtml = `
            <div style="margin-bottom: 10px;">
              <span class="badge-outlined muted">Etkinlik Sona Erdi</span>
            </div>
          `;
        }

        // --- buton mantığı ---
        // Use centralized permission check
        const clubId = ev.kulup_id || ev.club_id;
        const permission = canRegisterToEvent(clubId);

        let actionHtml = "";
        if (isFuture) {
          if (ev.registered) {
            // Only allow cancellation if user is approved member
            if (permission.canRegister) {
              actionHtml = `
              <button type="button" class="button-ghost button-small event-cancel-btn" 
                        style="border-color: var(--danger); color: var(--danger);"
                        data-event-id="${ev.etkinlik_id}">
                        Başvuruyu Geri Çek
                     </button>`;
            } else {
              actionHtml = `<span class="badge-outlined muted" style="padding: 8px 12px;">${permission.message}</span>`;
            }
          } else if (isFull || remainingQuota === 0) {
            actionHtml = `<span class="badge-outlined danger" style="padding: 8px 12px;">Kontenjan Dolu</span>`;
          } else if (!permission.canRegister) {
            // User is pending or not a member - show consistent message
            actionHtml = `<span class="badge-outlined warning" style="padding: 8px 12px;">${permission.message}</span>`;
          } else {
            actionHtml = `
              <button type="button" class="button-primary button-small event-register-btn" 
                              data-event-id="${ev.etkinlik_id}">
                              Kayıt Ol
                           </button>`;
          }
        } else {
          actionHtml = `<span class="badge-outlined muted">Süresi Doldu</span>`;
        }

        html += `
          <div class="card-fancy" style="margin-bottom: 0;">
            <div class="list-item-fancy" style="border-bottom: none; padding: 0;">
              <div class="list-item-content">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <div class="text-gradient" style="font-size: 16px; font-weight: 700;">${escapeHtml(ev.name || "")}</div>
                    ${isFuture ?
            `<span class="badge-outlined accent">Yaklaşan</span>` :
            `<span class="badge-outlined muted">Geçmiş</span>`
          }
                </div>

                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
                  <span style="color: var(--accent); font-weight: 600;">${escapeHtml(ev.kulup_name || "")}</span>
                  • ${evDate.toLocaleString("tr-TR")}
                </div>
            
                ${quotaHtml}

                <div style="font-size: 13px; color: var(--text-muted); line-height: 1.5; opacity: 0.9;">
                  ${escapeHtml(ev.description || "")}
                </div>

                <div id="eventMsg-${ev.etkinlik_id}" style="margin-top:8px; font-size:13px; min-height: 20px;"></div>
              </div>

              <div class="list-item-actions" style="margin-left: 16px;">
                ${actionHtml}
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      inner.innerHTML = html;
    };

    // ilk render
    renderEvents(sortedEvents);

    // Event delegation for register/cancel buttons
    if (inner) {
      inner.addEventListener('click', async (e) => {
        const registerBtn = e.target.closest('.event-register-btn');
        const cancelBtn = e.target.closest('.event-cancel-btn');

        if (registerBtn) {
          e.preventDefault();
          e.stopPropagation();
          const eventId = registerBtn.getAttribute('data-event-id');
          if (eventId) await registerEvent(eventId, e);
        } else if (cancelBtn) {
          e.preventDefault();
          e.stopPropagation();
          const eventId = cancelBtn.getAttribute('data-event-id');
          if (eventId) await cancelEvent(eventId, e);
        }
      });
    }

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


async function registerEvent(eventId, eventObj) {
  if (eventObj) {
    eventObj.preventDefault();
    eventObj.stopPropagation();
  }

  // 🔥 PAGE LOCK: Lock current page to prevent overview navigation
  const currentPage = getActivePage();
  setPageLock(currentPage, 1000);

  const msgEl = document.getElementById(`eventMsg-${eventId}`);
  if (msgEl) {
    msgEl.textContent = "İşleniyor...";
    msgEl.className = "status-info";
  }

  // Check membership before attempting registration
  try {
    const evRes = await fetch(`${API}/members/events`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    if (evRes.ok) {
      const events = await evRes.json();
      const event = events.find(e => (e.id || e.event_id || e.etkinlik_id) == eventId);

      if (event) {
        const clubId = event.kulup_id || event.club_id;
        if (membershipOverview && clubId) {
          const approved = membershipOverview.approved || [];
          const isMember = approved.some(c => c.club_id === Number(clubId));

          if (!isMember) {
            if (msgEl) {
              msgEl.textContent = `Bu etkinliğe katılmak için önce ${event.kulup_name || 'bu kulüp'} kulübüne üye olmalısın.`;
              msgEl.className = "status-error";
            }
            return;
          }
        }
      }
    }
  } catch (e) {
    console.error('Membership check error:', e);
  }

  try {
    const res = await fetch(`${API}/members/events/${eventId}/register`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    let data = {};
    try { data = await res.json(); } catch (_) { }

    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = data.message || "Başarıyla kaydoldunuz";
        msgEl.className = "status-success";
      }
      showToast(data.message || "Etkinliğe kaydınız alındı.", "success");

      // Update UI locally instead of reloading entire list
      const registerBtn = document.querySelector(`.event-register-btn[data-event-id="${eventId}"]`);
      if (registerBtn) {
        const actionsContainer = registerBtn.closest('.list-item-actions');
        if (actionsContainer) {
          actionsContainer.innerHTML = `
            <button type="button" class="button-ghost button-small event-cancel-btn" 
                    style="border-color: var(--danger); color: var(--danger);"
                    data-event-id="${eventId}">
                    Başvuruyu Geri Çek
            </button>`;
        }
      }
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

async function cancelEvent(eventId, eventObj) {
  if (eventObj) {
    eventObj.preventDefault();
    eventObj.stopPropagation();
  }

  // 🔥 PAGE LOCK: Lock current page to prevent overview navigation
  const currentPage = getActivePage();
  setPageLock(currentPage, 1000);

  const msgEl = document.getElementById(`eventMsg-${eventId}`);
  if (msgEl) {
    msgEl.textContent = "İşleniyor...";
    msgEl.className = "status-info";
  }

  // Check membership before attempting cancellation
  try {
    const evRes = await fetch(`${API}/members/events`, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    if (evRes.ok) {
      const events = await evRes.json();
      const event = events.find(e => (e.id || e.event_id || e.etkinlik_id) == eventId);

      if (event) {
        const clubId = event.kulup_id || event.club_id;
        if (membershipOverview && clubId) {
          const approved = membershipOverview.approved || [];
          const isMember = approved.some(c => c.club_id === Number(clubId));

          if (!isMember) {
            if (msgEl) {
              msgEl.textContent = `Bu etkinliğe katılmak için önce ${event.kulup_name || 'bu kulüp'} kulübüne üye olmalısın.`;
              msgEl.className = "status-error";
            }
            return;
          }
        }
      }
    }
  } catch (e) {
    console.error('Membership check error:', e);
  }

  try {
    const res = await fetch(`${API}/members/events/${eventId}/register`, {
      method: "DELETE",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    let data = {};
    try { data = await res.json(); } catch (_) { }

    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = data.message || "Başvurunuz geri çekildi";
        msgEl.className = "status-success";
      }
      showToast(data.message || "Etkinlik başvurunuz geri çekildi.", "success");

      // Update UI locally instead of reloading entire list
      const cancelBtn = document.querySelector(`.event-cancel-btn[data-event-id="${eventId}"]`);
      if (cancelBtn) {
        const actionsContainer = cancelBtn.closest('.list-item-actions');
        if (actionsContainer) {
          actionsContainer.innerHTML = `
            <button type="button" class="button-primary button-small event-register-btn" 
                    data-event-id="${eventId}">
                    Kayıt Ol
            </button>`;
        }
      }
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
            <div class="list-item-fancy" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle); background: rgba(15,23,42,0.4);">
               <div class="list-item-content">
                  <div style="font-weight: 600; font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${escapeHtml(ev.name)}</div>
                  <div style="font-size: 11px; color: var(--accent);">${d.toLocaleString("tr-TR")}</div>
               </div>
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
            <div class="list-item-fancy" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle); background: rgba(15,23,42,0.4);">
               <div class="list-item-content">
                  <div style="font-weight: 600; font-size: 13px; color: var(--text-muted); margin-bottom: 2px; text-decoration: line-through;">${escapeHtml(ev.name)}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${d.toLocaleString("tr-TR")}</div>
               </div>
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
      // Fallback or empty
      el.innerHTML = `<p style="font-size:13px; color: var(--text-muted);">Duyurular alınamadı.</p>`;
      return;
    }

    let data = await res.json();

    // Fallback dummy if empty for demo purposes (optional, but good for "wow" factor if empty)
    if (!Array.isArray(data) || data.length === 0) {
      // DUMMY DATA FALLBACK for demo
      data = [
        { title: "Yeni Dönem Başlıyor", kulup_name: "Yönetim", description: "Bahar dönemi kulüp başvuruları açıldı!", created_at: new Date().toISOString() },
        { title: "Tanışma Toplantısı", kulup_name: "Dans Kulübü", description: "Cuma günü öğleden sonra tanışma çayı.", created_at: new Date(Date.now() - 86400000).toISOString() }
      ];
    }

    el.innerHTML = data.slice(0, 4).map((a) => {
      const dateTxt = a.created_at ? new Date(a.created_at).toLocaleString("tr-TR") : "";

      return `
        <div class="list-item-fancy" style="padding: 12px; align-items: center;">
          <div class="list-item-content">
             <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${escapeHtml(a.title)}</div>
                <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">${dateTxt}</div>
             </div>
             <div style="font-size: 12px; color: var(--accent); margin-bottom: 2px;">${escapeHtml(a.kulup_name || "Sistem")}</div>
             <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">${escapeHtml(a.description)}</div>
          </div>
        </div>
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
      const eventId = ev.id || ev.event_id || ev.etkinlik_id;
      console.log('Event data:', ev, 'Using ID:', eventId);
      return `
        <div class="list-item-fancy" style="padding: 12px;">
           <div class="list-item-content">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">${escapeHtml(ev.name)}</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                 <span style="color: var(--accent);">${escapeHtml(ev.kulup_name || "")}</span> • ${d.toLocaleString("tr-TR")}
              </div>
              <div style="font-size: 12px; opacity: 0.9;">${escapeHtml(ev.description || "")}</div>
           </div>
           <div class="list-item-actions">
              <button class="button-ghost button-small" style="font-size: 11px; padding: 4px 8px;" 
                 onclick="showEventDetail(${eventId}); event.stopPropagation();">Git</button>
           </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    console.error(e);
    if (ph) ph.textContent = "Hata oluştu.";
  }
}


// ==============================
// Photo Lightbox
// ==============================
function showPhotoLightbox(photoSrc) {
  const lightbox = document.getElementById('photoLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (lightbox && lightboxImg) {
    lightboxImg.src = photoSrc;
    lightbox.style.display = 'flex';
  }
}
window.showPhotoLightbox = showPhotoLightbox;

function closePhotoLightbox() {
  const lightbox = document.getElementById('photoLightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
}
window.closePhotoLightbox = closePhotoLightbox;

// ==============================
// Toast Notification System with SessionStorage Persistence
// ==============================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Save to sessionStorage for persistence across redirects
  sessionStorage.setItem('pendingToast', JSON.stringify({
    message,
    type,
    timestamp: Date.now()
  }));

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds (minimum)
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

window.showToast = showToast;

// Check for pending toast on page load
document.addEventListener('DOMContentLoaded', () => {
  const pendingToast = sessionStorage.getItem('pendingToast');
  if (pendingToast) {
    try {
      const { message, type, timestamp } = JSON.parse(pendingToast);
      // Show toast if it was created within the last 5 seconds
      if (Date.now() - timestamp < 5000) {
        setTimeout(() => {
          showToast(message, type);
        }, 100);
      }
      // Clear the pending toast
      sessionStorage.removeItem('pendingToast');
    } catch (e) {
      console.error('Failed to restore toast:', e);
      sessionStorage.removeItem('pendingToast');
    }
  }
});

