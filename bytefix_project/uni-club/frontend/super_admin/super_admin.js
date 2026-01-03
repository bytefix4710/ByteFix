const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "superAdminToken";

// ------- ortak yardımcılar -------

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
  window.location.href = "login.html";
}
window.logout = logout;

// ------- LOGIN SAYFASI -------

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const msg = document.getElementById("msg");
    if (msg) msg.textContent = "";

    try {
      const res = await fetch(`${API}/super-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Giriş başarısız.");
      }

      const data = await res.json();
      setToken(data.access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = err.message;
    }
  });
}

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
  if (pageName === "dashboard") {
    loadDashboardStats();
  } else if (pageName === "clubs") {
    loadClubs();
  } else if (pageName === "users") {
    loadUsers();
  } else if (pageName === "events") {
    loadEvents();
  } else if (pageName === "announcements") {
    loadAnnouncements();
  }
}

window.showPage = showPage;

// Sayfa yüklendiğinde kontrol et
if (document.getElementById("page-dashboard")) {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
  } else {
    // Varsayılan olarak dashboard'u göster
    showPage("dashboard");
  }
}

// ------- ANA DASHBOARD İSTATİSTİKLERİ -------

async function loadDashboardStats() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Stats endpoint'inden tüm istatistikleri al
    const statsRes = await fetch(`${API}/super-admin/stats`, {
      headers: { ...authHeader() },
    });

    if (statsRes.status === 401) {
      logout();
      return;
    }

    if (statsRes.ok) {
      const stats = await statsRes.json();
      
      const clubsCount = document.getElementById("statClubs");
      if (clubsCount) {
        clubsCount.textContent = stats.total_clubs || 0;
      }

      const usersCount = document.getElementById("statUsers");
      if (usersCount) {
        usersCount.textContent = stats.total_members || 0;
      }

      const announcementsCount = document.getElementById("statAnnouncements");
      if (announcementsCount) {
        announcementsCount.textContent = stats.total_announcements || 0;
      }

      const eventsCount = document.getElementById("statEvents");
      if (eventsCount) {
        eventsCount.textContent = stats.total_events || 0;
      }
    } else {
      // Fallback: Eğer stats endpoint çalışmazsa, kulüp sayısını manuel al
      const clubsRes = await fetch(`${API}/super-admin/clubs`, {
        headers: { ...authHeader() },
      });

      if (clubsRes.ok) {
        const clubs = await clubsRes.json();
        const clubsCount = document.getElementById("statClubs");
        if (clubsCount) {
          clubsCount.textContent = clubs.length;
        }
      }
    }
  } catch (err) {
    console.error("İstatistikler yüklenemedi:", err);
  }
}

// ------- KULÜPLER SAYFASI -------

const clubsListDiv = document.getElementById("clubsList");
const clubForm = document.getElementById("clubForm");
const clubModal = document.getElementById("clubModal");

let clubsCache = [];

async function loadClubs() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/super-admin/clubs`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Kulüpler yüklenemedi.");
    }

    clubsCache = await res.json();
    renderClubs();
  } catch (err) {
    console.error(err);
    if (clubsListDiv) {
      clubsListDiv.textContent = "Bir hata oluştu, kulüpler yüklenemedi.";
    }
  }
}

function renderClubs() {
  if (!clubsListDiv) return;

  // Filtre değerlerini al
  const clubNameFilter = document.getElementById("clubNameFilter");
  const clubIdFilter = document.getElementById("clubIdFilter");
  const adminIdFilter = document.getElementById("adminIdFilter");
  
  const nameFilterValue = clubNameFilter ? clubNameFilter.value.toLowerCase().trim() : "";
  const clubIdFilterValue = clubIdFilter ? clubIdFilter.value.trim() : "";
  const adminIdFilterValue = adminIdFilter ? adminIdFilter.value.trim() : "";

  // Filtreleme
  let filtered = clubsCache;

  if (nameFilterValue) {
    filtered = filtered.filter((club) =>
      club.name.toLowerCase().includes(nameFilterValue)
    );
  }

  if (clubIdFilterValue) {
    const clubIdNum = parseInt(clubIdFilterValue);
    if (!isNaN(clubIdNum)) {
      filtered = filtered.filter((club) => club.id === clubIdNum);
    }
  }

  if (adminIdFilterValue) {
    const adminIdNum = parseInt(adminIdFilterValue);
    if (!isNaN(adminIdNum)) {
      filtered = filtered.filter((club) => club.admin_id === adminIdNum);
    }
  }

  if (filtered.length === 0) {
    clubsListDiv.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; margin-top: 20px;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">🔍</div>
        <h3 style="color: var(--text-muted); font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">Kulüp bulunamadı</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0;">Bu filtreye uygun kulüp bulunmuyor. Filtreleri değiştirip tekrar deneyin.</p>
      </div>
    `;
    return;
  }

  clubsListDiv.innerHTML = `
    <div style="display: grid; gap: 20px; margin-top: 20px">
      ${filtered
        .map(
          (club) => `
        <div class="card" style="padding: 24px; border: 1px solid rgba(99, 102, 241, 0.15); background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%); transition: all 0.3s ease; position: relative; overflow: hidden;"
             onmouseover="this.style.borderColor='rgba(99, 102, 241, 0.4)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(99, 102, 241, 0.15)'"
             onmouseout="this.style.borderColor='rgba(99, 102, 241, 0.15)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; position: relative; z-index: 1">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
                <span style="font-size: 24px;">🏛️</span>
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${escapeHtml(club.name)}</h3>
              </div>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px">
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; font-size: 12px; color: var(--accent); border: 1px solid rgba(99, 102, 241, 0.2);">
                  <span>🆔</span>
                  <span>ID: ${club.id}</span>
                </span>
                ${club.admin_id ? `
                  <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; font-size: 12px; color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2);">
                    <span>👤</span>
                    <span>Admin ID: ${club.admin_id}</span>
                  </span>
                ` : `
                  <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(148, 163, 184, 0.1); border-radius: 12px; font-size: 12px; color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.2);">
                    <span>⚠️</span>
                    <span>Yönetici yok</span>
                  </span>
                `}
              </div>
            </div>
            <div style="display: flex; gap: 8px; position: relative; z-index: 1">
              <button class="button-ghost" onclick="editClub(${club.id})" style="font-size: 13px; padding: 8px 16px; border-radius: var(--radius-md); transition: all 0.2s;"
                      onmouseover="this.style.background='rgba(99, 102, 241, 0.15)'; this.style.borderColor='var(--accent)'"
                      onmouseout="this.style.background='transparent'; this.style.borderColor='var(--border)'">
                ✏️ Düzenle
              </button>
              <button class="button-ghost" onclick="deleteClub(${club.id})" style="font-size: 13px; padding: 8px 16px; border-radius: var(--radius-md); color: var(--danger); border-color: rgba(239, 68, 68, 0.3); transition: all 0.2s;"
                      onmouseover="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.6)'"
                      onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(239, 68, 68, 0.3)'">
                🗑️ Sil
              </button>
            </div>
          </div>
          
          ${club.image_url ? `
            <div style="margin-bottom: 16px; border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
              <img src="${escapeHtml(club.image_url)}" alt="${escapeHtml(club.name)}" style="width: 100%; max-height: 250px; object-fit: cover; display: block;" onerror="this.style.display='none'" />
            </div>
          ` : ""}
          
          ${club.description ? `
            <div style="margin-bottom: 16px; padding: 14px; background: rgba(148, 163, 184, 0.05); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
              <p style="margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.6;">${escapeHtml(club.description)}</p>
            </div>
          ` : ""}
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px;">
            ${club.mission ? `
              <div style="padding: 16px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); border-radius: var(--radius-md); border: 1px solid rgba(99, 102, 241, 0.2);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                  <span style="font-size: 18px;">🎯</span>
                  <strong style="color: var(--accent); font-size: 13px; font-weight: 600;">Misyon</strong>
                </div>
                <p style="margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${escapeHtml(club.mission)}</p>
              </div>
            ` : ""}
            
            ${club.vision ? `
              <div style="padding: 16px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); border-radius: var(--radius-md); border: 1px solid rgba(99, 102, 241, 0.2);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                  <span style="font-size: 18px;">👁️</span>
                  <strong style="color: var(--accent); font-size: 13px; font-weight: 600;">Vizyon</strong>
                </div>
                <p style="margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${escapeHtml(club.vision)}</p>
              </div>
            ` : ""}
          </div>
          
          ${(club.email || club.phone) ? `
            <div style="display: flex; gap: 20px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.1); flex-wrap: wrap;">
              ${club.email ? `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px;">
                  <span style="font-size: 16px;">📧</span>
                  <span>${escapeHtml(club.email)}</span>
                </div>
              ` : ""}
              ${club.phone ? `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px;">
                  <span style="font-size: 16px;">📞</span>
                  <span>${escapeHtml(club.phone)}</span>
                </div>
              ` : ""}
            </div>
          ` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// Filtreleri temizle fonksiyonu
window.clearClubFilters = function() {
  const clubNameFilter = document.getElementById("clubNameFilter");
  const clubIdFilter = document.getElementById("clubIdFilter");
  const adminIdFilter = document.getElementById("adminIdFilter");
  
  if (clubNameFilter) clubNameFilter.value = "";
  if (clubIdFilter) clubIdFilter.value = "";
  if (adminIdFilter) adminIdFilter.value = "";
  
  renderClubs();
};

// Filtre input event listener'ları
const clubNameFilterInput = document.getElementById("clubNameFilter");
if (clubNameFilterInput) {
  clubNameFilterInput.addEventListener("input", () => {
    renderClubs();
  });
}

const clubIdFilterInput = document.getElementById("clubIdFilter");
if (clubIdFilterInput) {
  clubIdFilterInput.addEventListener("input", () => {
    renderClubs();
  });
}

const adminIdFilterInput = document.getElementById("adminIdFilter");
if (adminIdFilterInput) {
  adminIdFilterInput.addEventListener("input", () => {
    renderClubs();
  });
}

// ------- Modal İşlemleri -------

function showCreateModal() {
  if (clubModal) {
    document.getElementById("modalTitle").textContent = "Yeni Kulüp";
    document.getElementById("modalSubtitle").textContent = "Yeni bir kulüp oluştur.";
    document.getElementById("clubId").value = "";
    document.getElementById("clubNameInput").value = "";
    document.getElementById("clubDescInput").value = "";
    document.getElementById("clubEmailInput").value = "";
    document.getElementById("clubPhoneInput").value = "";
    document.getElementById("clubAdminIdInput").value = "";
    document.getElementById("clubMissionInput").value = "";
    document.getElementById("clubVisionInput").value = "";
    document.getElementById("clubImageUrlInput").value = "";
    clubModal.style.display = "flex";
    // Body scroll'unu engelle
    document.body.style.overflow = "hidden";
  }
}
window.showCreateModal = showCreateModal;

function closeModal() {
  if (clubModal) {
    clubModal.style.display = "none";
    // Body scroll'unu geri aç
    document.body.style.overflow = "";
    const statusMsg = document.getElementById("statusMsg");
    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }
  }
}
window.closeModal = closeModal;

async function editClub(clubId) {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/super-admin/clubs/${clubId}`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Kulüp bilgisi alınamadı.");
    }

    const club = await res.json();

    if (clubModal) {
      document.getElementById("modalTitle").textContent = "Kulüp Düzenle";
      document.getElementById("modalSubtitle").textContent = "Kulüp bilgilerini güncelle.";
      document.getElementById("clubId").value = club.id;
      document.getElementById("clubNameInput").value = club.name || "";
      document.getElementById("clubDescInput").value = club.description || "";
      document.getElementById("clubEmailInput").value = club.email || "";
      document.getElementById("clubPhoneInput").value = club.phone || "";
      document.getElementById("clubAdminIdInput").value = club.admin_id || "";
      document.getElementById("clubMissionInput").value = club.mission || "";
      document.getElementById("clubVisionInput").value = club.vision || "";
      document.getElementById("clubImageUrlInput").value = club.image_url || "";
      clubModal.style.display = "flex";
      // Body scroll'unu engelle
      document.body.style.overflow = "hidden";
    }
  } catch (err) {
    console.error(err);
    alert("Kulüp bilgisi yüklenemedi: " + err.message);
  }
}
window.editClub = editClub;

async function deleteClub(clubId) {
  if (!confirm("Bu kulübü silmek istediğinize emin misiniz?")) {
    return;
  }

  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/super-admin/clubs/${clubId}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Silme başarısız.");
    }

    await loadClubs();
    // Dashboard istatistiklerini de güncelle
    if (document.getElementById("page-dashboard")?.classList.contains("active")) {
      await loadDashboardStats();
    }
  } catch (err) {
    console.error(err);
    alert("Kulüp silinemedi: " + err.message);
  }
}
window.deleteClub = deleteClub;

// ------- Kulüp Form İşlemleri -------

if (clubForm) {
  clubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById("statusMsg");
    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }

    const clubId = document.getElementById("clubId").value;
    const name = document.getElementById("clubNameInput").value.trim();
    const description = document.getElementById("clubDescInput").value.trim();
    const email = document.getElementById("clubEmailInput").value.trim();
    const phone = document.getElementById("clubPhoneInput").value.trim();
    const adminId = document.getElementById("clubAdminIdInput").value.trim();
    const mission = document.getElementById("clubMissionInput").value.trim();
    const vision = document.getElementById("clubVisionInput").value.trim();
    const imageUrl = document.getElementById("clubImageUrlInput").value.trim();

    const payload = {
      name,
      description: description || null,
      email: email || null,
      phone: phone || null,
      admin_id: adminId ? parseInt(adminId) : null,
      mission: mission || null,
      vision: vision || null,
      image_url: imageUrl || null,
    };

    try {
      let res;
      if (clubId) {
        // Güncelleme
        res = await fetch(`${API}/super-admin/clubs/${clubId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Oluşturma
        res = await fetch(`${API}/super-admin/clubs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "İşlem başarısız.");
      }

      if (statusMsg) {
        statusMsg.textContent = "Başarıyla kaydedildi ✅";
        statusMsg.classList.add("status-success");
      }

      await loadClubs();
      // Dashboard istatistiklerini de güncelle
      if (document.getElementById("page-dashboard")?.classList.contains("active")) {
        await loadDashboardStats();
      }
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.textContent = err.message;
        statusMsg.classList.add("status-error");
      }
    }
  });
}

// Modal dışına tıklandığında kapat
if (clubModal) {
  clubModal.addEventListener("click", (e) => {
    if (e.target === clubModal) {
      closeModal();
    }
  });
}

// ------- KULLANICILAR SAYFASI -------

let usersCache = [];

async function loadUsers() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const usersListDiv = document.getElementById("usersList");
  if (!usersListDiv) return;

  try {
    usersListDiv.innerHTML = "<p style='color: var(--text-muted)'>Yükleniyor...</p>";

    const res = await fetch(`${API}/super-admin/users`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Kullanıcılar yüklenemedi.");
    }

    usersCache = await res.json();
    renderUsersTable();
  } catch (err) {
    console.error(err);
    if (usersListDiv) {
      usersListDiv.innerHTML = "<p style='color: red; font-size: 13px;'>Kullanıcılar yüklenirken hata oluştu.</p>";
    }
  }
}

function renderUsersTable() {
  const usersListDiv = document.getElementById("usersList");
  if (!usersListDiv) return;

  const userTypeFilter = document.getElementById("userTypeFilter");
  const searchInput = document.getElementById("userSearchInput");
  
  const filterValue = userTypeFilter ? userTypeFilter.value : "all";
  const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let filtered = usersCache;

  // Kullanıcı tipine göre filtrele
  if (filterValue !== "all") {
    filtered = filtered.filter((u) => u.user_type === filterValue);
  }

  // Arama filtresi
  if (searchValue) {
    filtered = filtered.filter((u) => {
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const clubName = (u.club_name || "").toLowerCase();
      return (
        fullName.includes(searchValue) ||
        email.includes(searchValue) ||
        clubName.includes(searchValue)
      );
    });
  }

  if (filtered.length === 0) {
    usersListDiv.innerHTML = "<p style='color: var(--text-muted); font-size: 13px;'>Bu filtreye uygun kullanıcı bulunamadı.</p>";
    return;
  }

  const rows = filtered
    .map((u) => {
      const userTypeBadge = u.user_type === "admin" 
        ? '<span class="status-badge approved" style="background: #6366f1; color: white;">Kulüp Yöneticisi</span>'
        : '<span class="status-badge pending" style="background: #10b981; color: white;">Üye</span>';
      
      const nameDisplay = u.first_name && u.last_name 
        ? `${u.first_name} ${u.last_name}` 
        : u.user_type === "admin" 
          ? "Kulüp Yöneticisi" 
          : "İsimsiz";
      
      const clubDisplay = u.club_name 
        ? `<span style="color: var(--accent); font-weight: 500;">${u.club_name}</span>` 
        : '<span style="color: var(--text-muted);">Kulüp yok</span>';

      return `
        <tr style="cursor: pointer; transition: background-color 0.2s;" 
            onmouseover="this.style.backgroundColor='rgba(99, 102, 241, 0.1)'" 
            onmouseout="this.style.backgroundColor='transparent'"
            onclick="filterByUserType('${u.user_type}')">
          <td>${userTypeBadge}</td>
          <td><strong>${escapeHtml(nameDisplay)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td>${clubDisplay}</td>
          <td style="color: var(--text-muted); font-family: monospace;">${escapeHtml(u.id)}</td>
        </tr>
      `;
    })
    .join("");

  usersListDiv.innerHTML = `
    <table class="member-table" style="width: 100%;">
      <thead>
        <tr>
          <th>Tip</th>
          <th>Ad Soyad</th>
          <th>Email</th>
          <th>Kulüp</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Filtreleme ve arama event listener'ları
const userTypeFilter = document.getElementById("userTypeFilter");
if (userTypeFilter) {
  userTypeFilter.addEventListener("change", () => {
    renderUsersTable();
  });
}

const userSearchInput = document.getElementById("userSearchInput");
if (userSearchInput) {
  userSearchInput.addEventListener("input", () => {
    renderUsersTable();
  });
}

// Kullanıcı tipine göre filtreleme fonksiyonu (tablodan tıklanınca)
window.filterByUserType = function(userType) {
  const filterSelect = document.getElementById("userTypeFilter");
  if (filterSelect) {
    filterSelect.value = userType;
    renderUsersTable();
  }
};

// HTML escape fonksiyonu (XSS önleme)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------- ETKİNLİKLER SAYFASI -------

let eventsCache = [];
let clubsCacheForEvents = [];

async function loadEvents() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const eventsListDiv = document.getElementById("eventsList");
  if (!eventsListDiv) return;

  try {
    eventsListDiv.innerHTML = "<p style='color: var(--text-muted)'>Yükleniyor...</p>";

    // Önce kulüpleri yükle (filtre için)
    const clubsRes = await fetch(`${API}/super-admin/clubs`, {
      headers: { ...authHeader() },
    });
    if (clubsRes.ok) {
      clubsCacheForEvents = await clubsRes.json();
      populateClubFilter();
    }

    // Etkinlikleri yükle
    const res = await fetch(`${API}/super-admin/events`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Etkinlikler yüklenemedi.");
    }

    eventsCache = await res.json();
    renderEvents();
  } catch (err) {
    console.error(err);
    if (eventsListDiv) {
      eventsListDiv.innerHTML = "<p style='color: red; font-size: 13px;'>Etkinlikler yüklenirken hata oluştu.</p>";
    }
  }
}

function populateClubFilter() {
  const clubFilter = document.getElementById("eventClubFilter");
  if (!clubFilter) return;

  // Mevcut seçimi sakla
  const currentValue = clubFilter.value;

  // Kulüpleri ekle
  clubFilter.innerHTML = '<option value="">🏛️ Tüm Kulüpler</option>';
  clubsCacheForEvents.forEach((club) => {
    const option = document.createElement("option");
    option.value = club.id;
    option.textContent = club.name;
    clubFilter.appendChild(option);
  });

  // Önceki seçimi geri yükle
  if (currentValue) {
    clubFilter.value = currentValue;
  }
}

function renderEvents() {
  const eventsListDiv = document.getElementById("eventsList");
  if (!eventsListDiv) return;

  // Filtre değerlerini al
  const clubFilter = document.getElementById("eventClubFilter");
  const dateFilter = document.getElementById("eventDateFilter");

  const clubFilterValue = clubFilter ? clubFilter.value : "";
  const dateValue = dateFilter ? dateFilter.value : "";

  // Filtreleme
  let filtered = eventsCache;

  if (clubFilterValue) {
    const clubIdNum = parseInt(clubFilterValue);
    if (!isNaN(clubIdNum)) {
      filtered = filtered.filter((event) => event.kulup_id === clubIdNum);
    }
  }

  if (dateValue) {
    const filterDate = new Date(dateValue);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.datetime);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= filterDate && eventDate < nextDay;
    });
  }

  if (filtered.length === 0) {
    const hasFilters = clubFilterValue || dateValue;
    eventsListDiv.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; margin-top: 20px;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📅</div>
        <h3 style="color: var(--text-muted); font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">${hasFilters ? "Etkinlik bulunamadı" : "Henüz etkinlik yok"}</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0;">${hasFilters ? "Bu filtreye uygun etkinlik bulunmuyor. Filtreleri değiştirip tekrar deneyin." : "Sistemde henüz etkinlik bulunmuyor."}</p>
      </div>
    `;
    return;
  }

  const eventsHtml = filtered
    .map((event) => {
      const formattedDate = new Date(event.datetime).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
        <div class="card" style="padding: 24px; border: 1px solid rgba(99, 102, 241, 0.15); background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%); transition: all 0.3s ease; position: relative; overflow: hidden; margin-bottom: 16px;"
             onmouseover="this.style.borderColor='rgba(99, 102, 241, 0.4)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(99, 102, 241, 0.15)'"
             onmouseout="this.style.borderColor='rgba(99, 102, 241, 0.15)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; position: relative; z-index: 1">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
                <span style="font-size: 24px;">📅</span>
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${escapeHtml(event.name)}</h3>
              </div>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px">
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; font-size: 12px; color: var(--accent); border: 1px solid rgba(99, 102, 241, 0.2);">
                  <span>🏛️</span>
                  <span>${escapeHtml(event.kulup_name)}</span>
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; font-size: 12px; color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2);">
                  <span>🕐</span>
                  <span>${formattedDate}</span>
                </span>
              </div>
            </div>
          </div>
          
          ${event.image_url ? `
            <div style="margin-bottom: 16px; border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
              <img src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.name)}" style="width: 100%; max-height: 250px; object-fit: cover; display: block;" onerror="this.style.display='none'" />
            </div>
          ` : ""}
          
          ${event.description ? `
            <div style="margin-bottom: 16px; padding: 14px; background: rgba(148, 163, 184, 0.05); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
              <p style="margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.6;">${escapeHtml(event.description)}</p>
            </div>
          ` : ""}
        </div>
      `;
    })
    .join("");

  eventsListDiv.innerHTML = eventsHtml;
}

// Filtreleri temizle fonksiyonu
window.clearEventFilters = function() {
  const clubFilter = document.getElementById("eventClubFilter");
  const dateFilter = document.getElementById("eventDateFilter");

  if (clubFilter) clubFilter.value = "";
  if (dateFilter) dateFilter.value = "";

  renderEvents();
};

// Filtre event listener'ları
const eventClubFilterInput = document.getElementById("eventClubFilter");
if (eventClubFilterInput) {
  eventClubFilterInput.addEventListener("change", () => {
    renderEvents();
  });
}

const eventDateFilterInput = document.getElementById("eventDateFilter");
if (eventDateFilterInput) {
  eventDateFilterInput.addEventListener("change", () => {
    renderEvents();
  });
}

// ------- DUYURULAR SAYFASI -------

let announcementsCache = [];
let clubsCacheForAnnouncements = [];

async function loadAnnouncements() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const announcementsListDiv = document.getElementById("announcementsList");
  if (!announcementsListDiv) return;

  try {
    announcementsListDiv.innerHTML = "<p style='color: var(--text-muted)'>Yükleniyor...</p>";

    // Önce kulüpleri yükle (filtre için)
    const clubsRes = await fetch(`${API}/super-admin/clubs`, {
      headers: { ...authHeader() },
    });
    if (clubsRes.ok) {
      clubsCacheForAnnouncements = await clubsRes.json();
      populateAnnouncementClubFilter();
    }

    // Duyuruları yükle
    const res = await fetch(`${API}/super-admin/announcements`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Duyurular yüklenemedi.");
    }

    announcementsCache = await res.json();
    renderAnnouncements();
  } catch (err) {
    console.error(err);
    if (announcementsListDiv) {
      announcementsListDiv.innerHTML = "<p style='color: red; font-size: 13px;'>Duyurular yüklenirken hata oluştu.</p>";
    }
  }
}

function populateAnnouncementClubFilter() {
  const clubFilter = document.getElementById("announcementClubFilter");
  const clubSelect = document.getElementById("announcementClubSelect");
  
  if (clubFilter) {
    const currentValue = clubFilter.value;
    clubFilter.innerHTML = '<option value="">🏛️ Tüm Kulüpler</option>';
    clubsCacheForAnnouncements.forEach((club) => {
      const option = document.createElement("option");
      option.value = club.id;
      option.textContent = club.name;
      clubFilter.appendChild(option);
    });
    if (currentValue) clubFilter.value = currentValue;
  }

  if (clubSelect) {
    clubSelect.innerHTML = '<option value="">🌐 Tüm Kulüpler (Sistem Geneli)</option>';
    clubsCacheForAnnouncements.forEach((club) => {
      const option = document.createElement("option");
      option.value = club.id;
      option.textContent = club.name;
      clubSelect.appendChild(option);
    });
  }
}

function renderAnnouncements() {
  const announcementsListDiv = document.getElementById("announcementsList");
  if (!announcementsListDiv) return;

  // Filtre değerlerini al
  const clubFilter = document.getElementById("announcementClubFilter");
  const dateFilter = document.getElementById("announcementDateFilter");
  const typeFilter = document.getElementById("announcementTypeFilter");

  const clubFilterValue = clubFilter ? clubFilter.value : "";
  const dateValue = dateFilter ? dateFilter.value : "";
  const typeValue = typeFilter ? typeFilter.value : "all";

  // Filtreleme
  let filtered = announcementsCache;

  if (clubFilterValue) {
    const clubIdNum = parseInt(clubFilterValue);
    if (!isNaN(clubIdNum)) {
      filtered = filtered.filter((ann) => ann.kulup_id === clubIdNum);
    }
  }

  if (dateValue) {
    const filterDate = new Date(dateValue);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    filtered = filtered.filter((ann) => {
      const annDate = new Date(ann.created_at);
      annDate.setHours(0, 0, 0, 0);
      return annDate >= filterDate && annDate < nextDay;
    });
  }

  if (typeValue === "system") {
    filtered = filtered.filter((ann) => ann.kulup_id === null || ann.kulup_name === "Sistem Geneli");
  } else if (typeValue === "club") {
    filtered = filtered.filter((ann) => ann.kulup_id !== null && ann.kulup_name !== "Sistem Geneli");
  }

  if (filtered.length === 0) {
    announcementsListDiv.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; margin-top: 20px;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📢</div>
        <h3 style="color: var(--text-muted); font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">Duyuru bulunamadı</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0;">Bu filtreye uygun duyuru bulunmuyor. Filtreleri değiştirip tekrar deneyin.</p>
      </div>
    `;
    return;
  }

  const announcementsHtml = filtered
    .map((ann) => {
      const formattedDate = new Date(ann.created_at).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const isSystemWide = ann.kulup_id === null || ann.kulup_name === "Sistem Geneli";

      return `
        <div class="card" style="padding: 24px; border: 1px solid rgba(99, 102, 241, 0.15); background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%); transition: all 0.3s ease; position: relative; overflow: hidden; margin-bottom: 16px;"
             onmouseover="this.style.borderColor='rgba(99, 102, 241, 0.4)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(99, 102, 241, 0.15)'"
             onmouseout="this.style.borderColor='rgba(99, 102, 241, 0.15)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; position: relative; z-index: 1">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
                <span style="font-size: 24px;">📢</span>
                <h3 style="margin: 0; font-size: 20px; font-weight: 600; background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${escapeHtml(ann.title)}</h3>
              </div>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px">
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: ${isSystemWide ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; border-radius: 12px; font-size: 12px; color: ${isSystemWide ? '#a78bfa' : 'var(--accent)'}; border: 1px solid ${isSystemWide ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)'};">
                  <span>${isSystemWide ? '🌐' : '🏛️'}</span>
                  <span>${escapeHtml(ann.kulup_name || "Sistem Geneli")}</span>
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; font-size: 12px; color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2);">
                  <span>🕐</span>
                  <span>${formattedDate}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 16px; padding: 14px; background: rgba(148, 163, 184, 0.05); border-left: 3px solid var(--accent); border-radius: var(--radius-md);">
            <p style="margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.6;">${escapeHtml(ann.description)}</p>
          </div>
        </div>
      `;
    })
    .join("");

  announcementsListDiv.innerHTML = announcementsHtml;
}

// Filtreleri temizle fonksiyonu
window.clearAnnouncementFilters = function() {
  const clubFilter = document.getElementById("announcementClubFilter");
  const dateFilter = document.getElementById("announcementDateFilter");
  const typeFilter = document.getElementById("announcementTypeFilter");

  if (clubFilter) clubFilter.value = "";
  if (dateFilter) dateFilter.value = "";
  if (typeFilter) typeFilter.value = "all";

  renderAnnouncements();
};

// Filtre event listener'ları
const announcementClubFilterInput = document.getElementById("announcementClubFilter");
if (announcementClubFilterInput) {
  announcementClubFilterInput.addEventListener("change", () => {
    renderAnnouncements();
  });
}

const announcementDateFilterInput = document.getElementById("announcementDateFilter");
if (announcementDateFilterInput) {
  announcementDateFilterInput.addEventListener("change", () => {
    renderAnnouncements();
  });
}

const announcementTypeFilterInput = document.getElementById("announcementTypeFilter");
if (announcementTypeFilterInput) {
  announcementTypeFilterInput.addEventListener("change", () => {
    renderAnnouncements();
  });
}

// Duyuru oluşturma modal fonksiyonları
window.openCreateAnnouncementModal = function() {
  const modal = document.getElementById("announcementModal");
  if (!modal) return;

  document.getElementById("announcementForm").reset();
  document.getElementById("announcementStatusMsg").textContent = "";
  document.getElementById("announcementStatusMsg").classList.remove("status-error", "status-success");

  // Kulüpleri yükle
  if (clubsCacheForAnnouncements.length === 0) {
    fetch(`${API}/super-admin/clubs`, {
      headers: { ...authHeader() },
    })
      .then((res) => res.json())
      .then((clubs) => {
        clubsCacheForAnnouncements = clubs;
        populateAnnouncementClubFilter();
      });
  } else {
    populateAnnouncementClubFilter();
  }

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
};

window.closeAnnouncementModal = function() {
  const modal = document.getElementById("announcementModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
    const statusMsg = document.getElementById("announcementStatusMsg");
    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }
  }
};

// Duyuru form submit
const announcementForm = document.getElementById("announcementForm");
if (announcementForm) {
  announcementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById("announcementStatusMsg");
    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }

    const title = document.getElementById("announcementTitleInput").value.trim();
    const description = document.getElementById("announcementDescInput").value.trim();
    const clubId = document.getElementById("announcementClubSelect").value;

    if (!title || !description) {
      if (statusMsg) {
        statusMsg.textContent = "Başlık ve içerik zorunludur.";
        statusMsg.classList.add("status-error");
      }
      return;
    }

    try {
      const payload = {
        title,
        description,
        kulup_id: clubId ? parseInt(clubId) : null,
      };

      const res = await fetch(`${API}/super-admin/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Duyuru oluşturulamadı.");
      }

      if (statusMsg) {
        statusMsg.textContent = "Duyuru başarıyla oluşturuldu ✅";
        statusMsg.classList.add("status-success");
      }

      await loadAnnouncements();
      setTimeout(() => {
        closeAnnouncementModal();
      }, 1000);
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.textContent = err.message;
        statusMsg.classList.add("status-error");
      }
    }
  });
}

// Modal dışına tıklandığında kapat
const announcementModal = document.getElementById("announcementModal");
if (announcementModal) {
  announcementModal.addEventListener("click", (e) => {
    if (e.target === announcementModal) {
      closeAnnouncementModal();
    }
  });
}
