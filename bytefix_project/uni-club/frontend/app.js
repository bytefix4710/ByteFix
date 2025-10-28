const API_URL = "http://127.0.0.1:8000";

// document.getElementById("addClub").addEventListener("click", async () => {
//   const name = document.getElementById("clubName").value.trim();
//   const desc = document.getElementById("clubDesc").value.trim();

//   if (!name) {
//     alert("Kulüp adı boş olamaz!");
//     return;
//   }

//   try {
//     const res = await fetch(`${API_URL}/clubs`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ name, description: desc })  // JSON olarak gönder
//     });

//     const data = await res.json();
//     alert(data.message);
//     document.getElementById("clubName").value = "";
//     document.getElementById("clubDesc").value = "";
//     loadClubs();
//   } catch (err) {
//     console.error("Kulüp eklenemedi:", err);
//   }
// });

// async function loadClubs() {
//   try {
//     const res = await fetch(`${API_URL}/clubs`);
//     const data = await res.json();

//     const list = document.getElementById("club-list");
//     list.innerHTML = "";
//     data.forEach(club => {
//       const li = document.createElement("li");
//       li.textContent = `${club.name} - ${club.description || ""}`;
//       list.appendChild(li);
//     });
//   } catch (err) {
//     console.error("Kulüpler yüklenemedi:", err);
//   }
// }

// loadClubs();

async function loadGelistirme() {
  try {
    const res = await fetch(`${API_URL}/gelistirme`);
    const data = await res.json();
    document.getElementById("gelistirme").textContent = data.description;
  } catch (err) {
    console.error("Geliştirme bilgisi yüklenemedi:", err);
  }
}

// Sayfa yüklendiğinde çağır
loadGelistirme();
