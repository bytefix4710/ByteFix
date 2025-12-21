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
    loadStats();
  }
  if (pageName === "announcements") loadAnnouncements();
}

window.showPage = showPage;

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

// ----------------------------
// ETKİNLİKLERİ YÜKLEME
// ----------------------------
let eventsCache = [];

function toDatetimeLocalValue(isoString) {
  // FastAPI datetime ISO -> input[type=datetime-local] format
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

async function loadEvents() {
  const eventsBox = document.getElementById("eventsList");
  if (!eventsBox) return;

  try {
    const res = await fetch(`${API}/club-admin/events`, {
      headers: { ...authHeader() },
    });

    if (res.status === 401) return logout();
    if (!res.ok) throw new Error("Etkinlikler alınamadı.");

    eventsCache = await res.json();

    if (eventsCache.length === 0) {
      eventsBox.innerHTML =
        "<p style='color: var(--text-muted); font-size:13px;'>Henüz etkinlik yok.</p>";
      return;
    }

    eventsBox.innerHTML = `
  <div class="events-grid">
    ${eventsCache
      .map((e) => {
        const formatted = new Date(e.datetime).toLocaleString("tr-TR");
        const desc = (e.description || "").trim();
        const img = (e.image_url || "").trim();

        return `
          <div class="event-card">
            <div class="event-card-inner">
              <div>
                <h3 class="event-title">${e.name}</h3>

                <div class="event-meta">
                  <span class="event-date">${formatted}</span>
                </div>

                ${
                  desc
                    ? `<p class="event-desc">${desc}</p>`
                    : `<p class="event-desc" style="color: var(--text-muted);">(Açıklama yok)</p>`
                }

                <div class="event-foot">
                  ${
                    img
                      ? `<span>Foto: <code>${img}</code></span>`
                      : `<span style="opacity:.75;">Foto yok</span>`
                  }
                </div>
              </div>

              <div class="event-actions">
                <button class="button-ghost" onclick="openRegsModal(${
                  e.etkinlik_id
                })">
                  Kayıtlar
                </button>
                <button class="button-primary" onclick="openEditEventModal(${
                  e.etkinlik_id
                })">
                  Düzenle
                </button>
                <button class="button-ghost btn-danger" onclick="deleteEvent(${
                  e.etkinlik_id
                })">
                  Sil
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("")}
  </div>
  `;
  } catch (err) {
    console.error(err);
    eventsBox.innerHTML =
      "<p style='color:red; font-size:13px;'>Etkinlikler yüklenirken hata oluştu.</p>";
  }
}

window.deleteEvent = async function (eventId) {
  const ok = confirm(
    "Bu etkinliği silmek istediğine emin misin? (Kayıtlar da silinir)"
  );
  if (!ok) return;

  const res = await fetch(`${API}/club-admin/events/${eventId}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (res.status === 401) return logout();
  if (!res.ok) {
    alert("Etkinlik silinemedi.");
    return;
  }

  loadEvents();
  loadStats();
};

window.openCreateEventModal = function () {
  const modal = document.getElementById("createEventModal");
  if (!modal) return;

  document.getElementById("createEventForm").reset();
  document.getElementById("createEventMsg").textContent = "";

  modal.style.display = "flex";
};

window.closeCreateEventModal = function () {
  const modal = document.getElementById("createEventModal");
  if (modal) modal.style.display = "none";
};

window.openEditEventModal = function (eventId) {
  const modal = document.getElementById("editEventModal");
  if (!modal) return;

  const ev = eventsCache.find((x) => x.etkinlik_id === eventId);
  if (!ev) return;

  document.getElementById("editEventId").value = ev.etkinlik_id;
  document.getElementById("editEventName").value = ev.name || "";
  document.getElementById("editEventDate").value = toDatetimeLocalValue(
    ev.datetime
  );
  document.getElementById("editEventDesc").value = ev.description || "";
  document.getElementById("editEventImage").value = ev.image_url || "";

  const msg = document.getElementById("editEventMsg");
  if (msg) msg.textContent = "";

  modal.style.display = "flex";
};

const createForm = document.getElementById("createEventForm");
if (createForm) {
  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("createEventName").value.trim();
    const datetime = document.getElementById("createEventDate").value;
    const description = document.getElementById("createEventDesc").value.trim();
    const image_url = document.getElementById("createEventImage").value.trim();
    const msg = document.getElementById("createEventMsg");

    msg.textContent = "";

    if (!name || !datetime) {
      msg.textContent = "Etkinlik adı ve tarih zorunludur.";
      msg.className = "status-error";
      return;
    }

    const res = await fetch(`${API}/club-admin/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        name,
        datetime,
        description: description || null,
        image_url: image_url || null,
      }),
    });

    if (res.status === 401) return logout();

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      msg.textContent = d.detail || "Etkinlik oluşturulamadı.";
      msg.className = "status-error";
      return;
    }

    msg.textContent = "Etkinlik başarıyla oluşturuldu ✅";
    msg.className = "status-success";

    loadEvents();
    loadStats();

    setTimeout(() => closeCreateEventModal(), 500);
  });
}

window.closeEditEventModal = function () {
  const modal = document.getElementById("editEventModal");
  if (modal) modal.style.display = "none";
};

const editForm = document.getElementById("editEventForm");
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const eventId = document.getElementById("editEventId").value;
    const name = document.getElementById("editEventName").value.trim();
    const datetime = document.getElementById("editEventDate").value;
    const description = document.getElementById("editEventDesc").value.trim();
    const image_url = document.getElementById("editEventImage").value.trim();
    const msg = document.getElementById("editEventMsg");

    const res = await fetch(`${API}/club-admin/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        name,
        datetime,
        description: description || null,
        image_url: image_url || null,
      }),
    });

    if (res.status === 401) return logout();

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (msg) {
        msg.textContent = d.detail || "Güncelleme başarısız.";
        msg.className = "status-error";
      }
      return;
    }

    if (msg) {
      msg.textContent = "Etkinlik güncellendi ✅";
      msg.className = "status-success";
    }

    loadEvents();
    loadStats();
    setTimeout(() => closeEditEventModal(), 400);
  });
}

let regsCache = [];
let activeRegsEventId = null;

window.openRegsModal = async function (eventId) {
  activeRegsEventId = eventId;
  const modal = document.getElementById("regsModal");
  if (!modal) return;

  const ev = eventsCache.find((x) => x.etkinlik_id === eventId);
  const subtitle = document.getElementById("regsSubtitle");
  if (subtitle && ev) subtitle.textContent = `${ev.name} • Katılım kayıtları`;

  modal.style.display = "flex";
  await loadRegs(eventId);
};

window.closeRegsModal = function () {
  const modal = document.getElementById("regsModal");
  if (modal) modal.style.display = "none";
};

async function loadRegs(eventId) {
  const box = document.getElementById("regsList");
  if (!box) return;

  box.textContent = "Yükleniyor...";

  const res = await fetch(`${API}/club-admin/events/${eventId}/registrations`, {
    headers: { ...authHeader() },
  });

  if (res.status === 401) return logout();
  if (!res.ok) {
    box.innerHTML = "<p style='color:red;'>Kayıtlar alınamadı.</p>";
    return;
  }

  regsCache = await res.json();
  const filter = document.getElementById("regsFilter")?.value || "all";
  renderRegs(filter);
}

function renderRegs(filterValue) {
  const box = document.getElementById("regsList");
  if (!box) return;

  let list = regsCache;
  if (filterValue !== "all")
    list = regsCache.filter((r) => r.status === filterValue);

  if (list.length === 0) {
    box.innerHTML =
      "<p style='color:var(--text-muted); font-size:13px;'>Kayıt yok.</p>";
    return;
  }

  box.innerHTML = list
    .map((r) => {
      let cls = "pending";
      if (r.status === "onaylandı") cls = "approved";
      else if (r.status === "reddedildi") cls = "rejected";

      const fullName =
        `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.ogrenci_id;

      return `
  <div class="reg-row">
    <div class="reg-info">
      <div class="reg-name-line">
        <span class="reg-name">${fullName}</span>
        <span class="reg-id">(${r.ogrenci_id})</span>
        <span class="status-badge ${cls}">${r.status}</span>
      </div>
      <div class="reg-email">${r.email || ""}</div>
    </div>

    <div class="reg-actions">
      ${
        r.status === "beklemede"
          ? `
            <button class="button-primary" onclick="approveReg(${r.kayit_id})">Onayla</button>
            <button class="button-ghost" onclick="rejectReg(${r.kayit_id})">Reddet</button>
          `
          : `
            <button class="button-ghost btn-danger" onclick="deleteReg(${r.kayit_id})">Kaydı Sil</button>
          `
      }
    </div>
  </div>
`;
    })
    .join("");
}

// filtre değişince
const regsFilter = document.getElementById("regsFilter");
if (regsFilter) {
  regsFilter.addEventListener("change", () => {
    renderRegs(regsFilter.value || "all");
  });
}

window.approveReg = async function (kayitId) {
  const res = await fetch(
    `${API}/club-admin/events/${activeRegsEventId}/registrations/${kayitId}/approve`,
    { method: "PUT", headers: { ...authHeader() } }
  );
  if (res.status === 401) return logout();
  await loadRegs(activeRegsEventId);
};

window.rejectReg = async function (kayitId) {
  const res = await fetch(
    `${API}/club-admin/events/${activeRegsEventId}/registrations/${kayitId}/reject`,
    { method: "PUT", headers: { ...authHeader() } }
  );
  if (res.status === 401) return logout();
  await loadRegs(activeRegsEventId);
};

window.deleteReg = async function (kayitId) {
  const ok = confirm("Bu kişinin etkinlik kaydı silinsin mi?");
  if (!ok) return;

  const res = await fetch(
    `${API}/club-admin/events/${activeRegsEventId}/registrations/${kayitId}`,
    {
      method: "DELETE",
      headers: { ...authHeader() },
    }
  );

  if (res.status === 401) return logout();

  if (!res.ok) {
    alert("Kayıt silinemedi.");
    return;
  }

  // listeyi yenile
  await loadRegs(activeRegsEventId);
  loadStats();
};

// İstersen bu endpoint'i backend’e ekleyebilirsin (opsiyonel).
window.setRegPending = async function (kayitId) {
  alert("Beklemeye alma endpoint'i eklenmedi. İstersen ekleriz.");
};

// Etkinlikler sekmesine tıklanınca listeyi yükle
const eventsTab = document.querySelector("[data-page='events']");
if (eventsTab) {
  eventsTab.addEventListener("click", () => {
    loadEvents();
  });
}

const eventForm = document.getElementById("eventForm");
if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("eventNameInput");
    const dateInput = document.getElementById("eventDateInput");
    const descInput = document.getElementById("eventDescInput");
    const imageInput = document.getElementById("eventImageInput");
    const statusMsg = document.getElementById("eventStatusMsg");

    if (statusMsg) {
      statusMsg.textContent = "";
      statusMsg.classList.remove("status-error", "status-success");
    }

    const name = nameInput.value.trim();
    const datetimeValue = dateInput.value; // "2025-12-05T14:30"
    const description = descInput.value.trim();
    const image_url = imageInput.value.trim();

    if (!name || !datetimeValue) {
      if (statusMsg) {
        statusMsg.textContent =
          "Lütfen etkinlik adı ve tarih alanlarını doldurun.";
        statusMsg.classList.add("status-error");
      }
      return;
    }

    try {
      const res = await fetch(`${API}/club-admin/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          name,
          datetime: datetimeValue,
          description: description || null,
          image_url: image_url || null,
        }),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Etkinlik oluşturulamadı.");
      }

      if (statusMsg) {
        statusMsg.textContent = "Etkinlik başarıyla oluşturuldu ✅";
        statusMsg.classList.add("status-success");
      }

      // formu temizle
      nameInput.value = "";
      dateInput.value = "";
      descInput.value = "";
      imageInput.value = "";

      // listeyi ve istatistikleri yenile
      loadEvents();
      loadStats();
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.textContent = err.message;
        statusMsg.classList.add("status-error");
      }
    }
  });
}

// ===== Announcements =====
window.openCreateAnnouncementModal = function () {
  const m = document.getElementById("createAnnouncementModal");
  if (!m) return;
  document.getElementById("createAnnouncementForm").reset();
  const msg = document.getElementById("announcementMsg");
  if (msg) msg.textContent = "";
  m.style.display = "flex";
};

window.closeCreateAnnouncementModal = function () {
  const m = document.getElementById("createAnnouncementModal");
  if (m) m.style.display = "none";
};

async function loadAnnouncements() {
  const box = document.getElementById("announcementsList");
  if (!box) return;

  box.textContent = "Yükleniyor...";

  const res = await fetch(`${API}/club-admin/announcements`, {
    headers: { ...authHeader() },
  });

  if (res.status === 401) return logout();
  if (!res.ok) {
    box.innerHTML =
      "<p style='color:red; font-size:13px;'>Duyurular alınamadı.</p>";
    return;
  }

  const anns = await res.json();

  if (anns.length === 0) {
    box.innerHTML =
      "<p style='color:var(--text-muted); font-size:13px;'>Henüz duyuru yok.</p>";
    return;
  }

  box.innerHTML = anns
    .map(
      (a) => `
      <div class="reg-row" style="grid-template-columns:minmax(0,1fr) 160px;">
        <div class="reg-info">
          <div class="reg-name-line">
            <span class="reg-name">Duyuru #${a.duyuru_id}</span>
          </div>
          <div class="reg-sub" style="margin-top:6px; color:var(--text-main); font-size:13px; line-height:1.45;">
            ${escapeHtml(a.description)}
          </div>
        </div>
        <div class="reg-actions">
          <button class="button-ghost btn-danger" onclick="deleteAnnouncement(${
            a.duyuru_id
          })">
            Sil
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

window.deleteAnnouncement = async function (duyuruId) {
  const ok = confirm("Bu duyuruyu silmek istiyor musun?");
  if (!ok) return;

  const res = await fetch(`${API}/club-admin/announcements/${duyuruId}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  if (res.status === 401) return logout();
  if (!res.ok) return alert("Duyuru silinemedi.");

  loadAnnouncements();
};

// Form submit
const annForm = document.getElementById("createAnnouncementForm");
if (annForm) {
  annForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const desc = document.getElementById("announcementDesc").value.trim();
    const msg = document.getElementById("announcementMsg");

    const res = await fetch(`${API}/club-admin/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ description: desc }),
    });

    if (res.status === 401) return logout();

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (msg) {
        msg.textContent = d.detail || "Duyuru oluşturulamadı.";
        msg.className = "status-error";
      }
      return;
    }

    if (msg) {
      msg.textContent = "Duyuru oluşturuldu ✅";
      msg.className = "status-success";
    }

    loadAnnouncements();
    setTimeout(() => closeCreateAnnouncementModal(), 400);
  });
}

// Basit HTML escape (XSS önleme)
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
