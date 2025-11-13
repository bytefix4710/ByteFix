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

// ------- REGISTER SAYFASI (kullanıyorsan) -------

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
if (clubInfoDiv) {
  (async () => {
    const token = getToken();
    if (!token) {
      // login yoksa login sayfasına
      window.location.href = "login.html";
      return;
    }

    try {
      const res = await fetch(`${API}/clubs/me`, {
        headers: { ...authHeader() },
      });

      if (res.status === 401) {
        // token bozuk/expired
        logout();
        return;
      }

      if (res.status === 404) {
        clubInfoDiv.textContent =
          "Bu admin hesabına bağlı kulüp bulunamadı. (Önce backend'den ilişkilendirmen gerekiyor.)";
        return;
      }

      if (!res.ok) {
        throw new Error("Kulüp bilgisi alınamadı.");
      }

      const club = await res.json();

      clubInfoDiv.innerHTML = `
        <h2>Kulübüm</h2>
        <p><span class="label">Kulüp ID:</span> ${club.id}</p>
        <p><span class="label">Ad:</span> ${club.name}</p>
        <p><span class="label">Açıklama:</span> ${club.description || "-"}</p>
        <p><span class="label">E-posta:</span> ${club.email || "-"}</p>
        <p><span class="label">Telefon:</span> ${club.phone || "-"}</p>
      `;

      const adminEmailSpan = document.getElementById("adminEmail");
      if (adminEmailSpan) {
        adminEmailSpan.textContent = "(Giriş yapıldı)";
      }
    } catch (err) {
      console.error(err);
      clubInfoDiv.textContent = "Bir hata oluştu, kulüp bilgisi yüklenemedi.";
    }
  })();
}
