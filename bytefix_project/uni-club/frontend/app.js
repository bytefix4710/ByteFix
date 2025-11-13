const API_URL = "http://127.0.0.1:8000";

async function loadGelistirme() {
  try {
    const res = await fetch(`${API_URL}/gelistirme`);
    const data = await res.json();
    document.getElementById("gelistirme").textContent = data.description;
  } catch (err) {
    console.error("Geliştirme bilgisi yüklenemedi:", err);
    document.getElementById("gelistirme").textContent =
      "Site durumu yüklenemedi.";
  }
}

// Sayfa yüklendiğinde çağır
loadGelistirme();
