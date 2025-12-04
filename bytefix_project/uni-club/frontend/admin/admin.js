const API = "http://127.0.0.1:8000";
const TOKEN_KEY = "clubAdminToken";

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
      const res = await fetch(`${API}/club-admin/login`, {
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

// ------- REGISTER SAYFASI-------

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    const msg = document.getElementById("msg");
    if (msg) msg.textContent = "";

    try {
      const res = await fetch(`${API}/club-admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Kayıt başarısız.");
      }

      if (msg)
        msg.textContent = "Kayıt başarılı, giriş ekranına yönlendiriliyorsun.";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = err.message;
    }
  });
}

// ------- DASHBOARD SAYFASI -------

const clubInfoDiv = document.getElementById("clubInfo");
const clubForm = document.getElementById("clubForm");

async function loadClub() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/club-admin/club/me`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (res.status === 404) {
      if (clubInfoDiv) {
        clubInfoDiv.textContent =
          "Bu admin hesabına bağlı kulüp bulunamadı. (Önce backend'den ilişkilendirmen gerekiyor.)";
      }
      return;
    }

    if (!res.ok) {
      throw new Error("Kulüp bilgisi alınamadı.");
    }

    const club = await res.json();

    if (clubInfoDiv) {
      clubInfoDiv.innerHTML = `
        <h2>Kulübüm</h2>
        <p><span class="label">Kulüp ID:</span> ${club.id}</p>
        <p><span class="label">Ad:</span> ${club.name}</p>
        <p><span class="label">Açıklama:</span> ${club.description || "-"}</p>
        <p><span class="label">E-posta:</span> ${club.email || "-"}</p>
        <p><span class="label">Telefon:</span> ${club.phone || "-"}</p>
      `;
    }

    const nameInput = document.getElementById("clubNameInput");
    const descInput = document.getElementById("clubDescInput");
    const emailInput = document.getElementById("clubEmailInput");
    const phoneInput = document.getElementById("clubPhoneInput");

    if (nameInput) nameInput.value = club.name || "";
    if (descInput) descInput.value = club.description || "";
    if (emailInput) emailInput.value = club.email || "";
    if (phoneInput) phoneInput.value = club.phone || "";

    const adminEmailSpan = document.getElementById("adminEmail");
    if (adminEmailSpan) {
      adminEmailSpan.textContent = "(Giriş yapıldı)";
    }
  } catch (err) {
    console.error(err);
    if (clubInfoDiv) {
      clubInfoDiv.textContent = "Bir hata oluştu, kulüp bilgisi yüklenemedi.";
    }
  }
}

if (clubInfoDiv) {
  loadClub();
}

async function loadStats() {
  const membersEl = document.getElementById("totalMembersValue");
  const eventsEl = document.getElementById("totalEventsValue");
  const pendingEl = document.getElementById("pendingMembersValue");

  // Genel bakış kartı yoksa uğraşma
  if (!membersEl && !eventsEl && !pendingEl) return;

  try {
    const res = await fetch(`${API}/club-admin/stats`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("İstatistikler alınamadı.");
    }

    const data = await res.json();
    if (membersEl) membersEl.textContent = data.total_members ?? 0;
    if (eventsEl) eventsEl.textContent = data.total_events ?? 0;
    if (pendingEl) pendingEl.textContent = data.pending_memberships ?? 0;
  } catch (err) {
    console.error(err);
  }
}

const overviewExists = document.getElementById("page-overview");
if (overviewExists) {
  loadStats();
}

// ------- Kulüp bilgilerini güncelle -------

if (clubForm) {
  clubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById("statusMsg");
    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }

    const name = document.getElementById("clubNameInput").value.trim();
    const description = document.getElementById("clubDescInput").value.trim();
    const email = document.getElementById("clubEmailInput").value.trim();
    const phone = document.getElementById("clubPhoneInput").value.trim();

    try {
      const res = await fetch(`${API}/club-admin/club/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          name,
          description,
          email,
          phone,
        }),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Güncelleme başarısız.");
      }

      if (statusMsg) {
        statusMsg.textContent = "Başarıyla kaydedildi ✅";
        statusMsg.classList.add("status-success");
      }

      await loadClub();
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.textContent = err.message;
        statusMsg.classList.add("status-error");
      }
    }
  });
}

// ----------------------------
// ÜYELİK LİSTELERİNİ YÜKLEME
// ----------------------------
let membersCache = [];

function renderMemberTable(filterValue = "all") {
  const allMembersBox = document.getElementById("allMembers");
  if (!allMembersBox) return;

  let filtered = membersCache;
  if (filterValue !== "all") {
    filtered = membersCache.filter((m) => m.status === filterValue);
  }

  if (filtered.length === 0) {
    allMembersBox.innerHTML =
      "<p style='color: var(--text-muted); font-size:13px;'>Bu filtreye uygun üye yok.</p>";
    return;
  }

  const rows = filtered
    .map((m) => {
      let statusClass = "pending";
      if (m.status === "onaylandı") statusClass = "approved";
      else if (m.status === "reddedildi") statusClass = "rejected";

      return `
        <tr>
          <td>${m.ogrenci_no}</td>
          <td>${m.ad} ${m.soyad}</td>
          <td>${m.email}</td>
          <td>
            <span class="status-badge ${statusClass}">
              ${m.status}
            </span>
          </td>
          <td>
            <button
              class="button-ghost btn-xs btn-danger"
              onclick="removeMember(${m.uyelik_id})"
            >
              Üyeliği Sil
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  allMembersBox.innerHTML = `
    <table class="member-table">
      <thead>
        <tr>
          <th>Öğrenci No</th>
          <th>Ad Soyad</th>
          <th>Email</th>
          <th>Durum</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

async function loadMembershipData() {
  if (!getToken()) return;

  const pendingBox = document.getElementById("pendingRequests");
  const filterSelect = document.getElementById("memberFilter");

  try {
    // --- Bekleyen istekler ---
    const reqRes = await fetch(`${API}/club-admin/members/requests`, {
      headers: { ...authHeader() },
    });
    const pending = await reqRes.json();

    if (pendingBox) {
      if (pending.length === 0) {
        pendingBox.innerHTML =
          "<p style='color: var(--text-muted); font-size:13px;'>Bekleyen başvuru yok.</p>";
      } else {
        pendingBox.innerHTML = pending
          .map(
            (m) => `
          <div class="member-row">
            <div class="member-info">
              <div><strong>${m.ad} ${m.soyad}</strong> (${m.ogrenci_no})</div>
              <div class="member-email">${m.email}</div>
            </div>
            <div class="member-actions">
              <button class="button-primary btn-xs" onclick="approve(${m.uyelik_id})">
                Onayla
              </button>
              <button class="button-ghost btn-xs" onclick="rejectReq(${m.uyelik_id})">
                Reddet
              </button>
            </div>
          </div>
        `
          )
          .join("");
      }
    }

    // --- Tüm üyeler ---
    const memRes = await fetch(`${API}/club-admin/members`, {
      headers: { ...authHeader() },
    });
    membersCache = await memRes.json();

    const currentFilter = filterSelect ? filterSelect.value : "all";
    renderMemberTable(currentFilter);
  } catch (e) {
    console.error(e);
    if (pendingBox)
      pendingBox.innerHTML =
        "<p style='color:red; font-size:13px;'>Üyelik verileri yüklenirken hata oluştu.</p>";
  }
}

window.approve = async function (id) {
  await fetch(`${API}/club-admin/members/${id}/approve`, {
    method: "PUT",
    headers: { ...authHeader() },
  });
  loadMembershipData();
  loadStats(); // 👈 istatistikleri de yenile
};

window.rejectReq = async function (id) {
  await fetch(`${API}/club-admin/members/${id}/reject`, {
    method: "PUT",
    headers: { ...authHeader() },
  });
  loadMembershipData();
  loadStats();
};

window.removeMember = async function (id) {
  const ok = confirm("Bu üyeyi kulüpten çıkarmak istediğine emin misin?");
  if (!ok) return;

  await fetch(`${API}/club-admin/members/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  loadMembershipData();
  loadStats();
};

const membersTab = document.querySelector("[data-page='members']");
if (membersTab) {
  membersTab.addEventListener("click", () => {
    loadMembershipData();
  });
}

const filterSelect = document.getElementById("memberFilter");
if (filterSelect) {
  filterSelect.addEventListener("change", () => {
    const value = filterSelect.value || "all";
    renderMemberTable(value);
  });
}
