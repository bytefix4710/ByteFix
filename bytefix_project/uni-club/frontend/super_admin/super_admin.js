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

    const clubs = await res.json();

    if (clubsListDiv) {
      if (clubs.length === 0) {
        clubsListDiv.innerHTML = "<p>Henüz kulüp bulunmuyor.</p>";
        return;
      }

      clubsListDiv.innerHTML = `
        <div style="display: grid; gap: 16px; margin-top: 16px">
          ${clubs
            .map(
              (club) => `
            <div class="card" style="padding: 20px">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px">
                <div>
                  <h3 style="margin: 0 0 8px 0">${club.name}</h3>
                  <p style="color: var(--text-muted); margin: 0; font-size: 14px">
                    ID: ${club.id} ${club.admin_id ? `| Admin ID: ${club.admin_id}` : ""}
                  </p>
                </div>
                <div style="display: flex; gap: 8px">
                  <button class="button-ghost" onclick="editClub(${club.id})" style="font-size: 14px">
                    Düzenle
                  </button>
                  <button class="button-ghost" onclick="deleteClub(${club.id})" style="font-size: 14px; color: var(--danger)">
                    Sil
                  </button>
                </div>
              </div>
              ${club.description ? `<p style="margin: 8px 0; color: var(--text-muted)">${club.description}</p>` : ""}
              <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 14px; color: var(--text-muted)">
                ${club.email ? `<span>📧 ${club.email}</span>` : ""}
                ${club.phone ? `<span>📞 ${club.phone}</span>` : ""}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
  } catch (err) {
    console.error(err);
    if (clubsListDiv) {
      clubsListDiv.textContent = "Bir hata oluştu, kulüpler yüklenemedi.";
    }
  }
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
    clubModal.style.display = "flex";
  }
}
window.showCreateModal = showCreateModal;

function closeModal() {
  if (clubModal) {
    clubModal.style.display = "none";
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
      clubModal.style.display = "flex";
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

    const payload = {
      name,
      description: description || null,
      email: email || null,
      phone: phone || null,
      admin_id: adminId ? parseInt(adminId) : null,
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
