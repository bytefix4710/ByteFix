const API = "http://127.0.0.1:8000";

// ------- ortak -------
function token() {
  return localStorage.getItem("token");
}
function setToken(t) {
  localStorage.setItem("token", t);
}
function authHeader() {
  return { Authorization: "Bearer " + token() };
}
function jh(h = {}) {
  return { "Content-Type": "application/json", ...h };
}

// ------- login -------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: jh(),
        body: JSON.stringify({ email, password, full_name: "x" }),
      });
      if (!res.ok) throw new Error("Giriş başarısız");
      const data = await res.json();
      setToken(data.access_token);
      window.location.href = "./dashboard.html";
    } catch (err) {
      document.getElementById("msg").textContent = err.message;
    }
  });
}

// ------- register -------
const regForm = document.getElementById("regForm");
if (regForm) {
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: jh(),
        body: JSON.stringify({ email, full_name, password }),
      });
      if (!res.ok) {
        throw new Error("Kayıt başarısız");
      }
      window.location.href = "./login.html";
    } catch (err) {
      document.getElementById("msg").textContent = err.message;
    }
  });
}

// ------- dashboard actions -------
async function loadClub() {
  const clubId = document.getElementById("clubId").value;
  const res = await fetch(`${API}/clubs/${clubId}`);
  const data = await res.json();
  document.getElementById("clubInfo").textContent = JSON.stringify(
    data,
    null,
    2
  );
  document.getElementById("clubName").value = data.name || "";
  document.getElementById("clubDesc").value = data.description || "";
}
window.loadClub = loadClub;

async function saveClub() {
  const clubId = document.getElementById("clubId").value;
  const body = {
    name: document.getElementById("clubName").value,
    description: document.getElementById("clubDesc").value,
  };
  const res = await fetch(`${API}/clubs/${clubId}`, {
    method: "PUT",
    headers: jh(authHeader()),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    alert("Yetki hatası veya istek hatası");
    return;
  }
  await loadClub();
}
window.saveClub = saveClub;

async function createEvent() {
  const clubId = parseInt(document.getElementById("clubId").value, 10);
  const body = {
    club_id: clubId,
    title: document.getElementById("evTitle").value,
    description: document.getElementById("evDesc").value,
    location: document.getElementById("evLocation").value,
    start_time: new Date(
      document.getElementById("evStart").value
    ).toISOString(),
    end_time: new Date(document.getElementById("evEnd").value).toISOString(),
  };
  const res = await fetch(`${API}/events`, {
    method: "POST",
    headers: jh(authHeader()),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    alert("Yetkisiz veya hata");
    return;
  }
  await loadEvents();
}
window.createEvent = createEvent;

async function loadEvents() {
  const clubId = document.getElementById("clubId").value;
  const res = await fetch(`${API}/events/${clubId}`);
  const data = await res.json();
  const ul = document.getElementById("evList");
  ul.innerHTML = "";
  data.forEach((ev) => {
    const li = document.createElement("li");
    li.textContent = `${ev.title} @ ${ev.location} (${new Date(
      ev.start_time
    ).toLocaleString()}) `;
    const del = document.createElement("button");
    del.textContent = "Sil";
    del.onclick = async () => {
      const r = await fetch(`${API}/events/${ev.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (r.ok) li.remove();
      else alert("Silinemedi");
    };
    li.appendChild(del);
    ul.appendChild(li);
  });
}
window.loadEvents = loadEvents;
