
// ==============================
// Event Detail Overlay
// ==============================
async function showEventDetail(eventId) {
    console.log('showEventDetail called', eventId);
    const overlay = document.getElementById('eventDetailOverlay');
    if (!overlay) return;

    try {
        // Fetch all events and find the specific one
        const res = await fetch(`${API}/members/events`, {
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
            console.error('Event list fetch failed');
            return;
        }

        const events = await res.json();
        const event = events.find(e => (e.id || e.event_id || e.etkinlik_id) == eventId);

        if (!event) {
            console.error('Event not found:', eventId);
            return;
        }

        // Populate overlay
        document.getElementById('eventDetailName').textContent = event.name || 'Etkinlik';
        document.getElementById('eventDetailClub').textContent = event.kulup_name || '';
        document.getElementById('eventDetailDate').textContent = new Date(event.datetime).toLocaleString('tr-TR');
        document.getElementById('eventDetailDescription').textContent = event.description || 'Açıklama yok.';
        document.getElementById('eventDetailTotalQuota').textContent = event.quota || '-';

        const registered = event.registered_count || 0;
        const remaining = (event.quota || 0) - registered;
        document.getElementById('eventDetailRemainingQuota').textContent = remaining;

        // Action buttons
        const actionsEl = document.getElementById('eventDetailActions');
        const msgEl = document.getElementById('eventDetailMessage');
        msgEl.textContent = '';
        msgEl.className = 'status-info';

        const now = new Date();
        const eventDate = new Date(event.datetime);
        const isPast = eventDate < now;
        const isFull = remaining <= 0;
        const isRegistered = event.is_registered || false;

        let buttonsHTML = '';
        if (isPast) {
            buttonsHTML = '<button class="button-ghost" disabled>Etkinlik Geçmiş</button>';
        } else if (isFull && !isRegistered) {
            buttonsHTML = '<button class="button-ghost" disabled>Kontenjan Dolu</button>';
        } else if (isRegistered) {
            buttonsHTML = `<button class="button-ghost" onclick="cancelEventFromOverlay(${eventId})">Başvuruyu Geri Çek</button>`;
        } else {
            buttonsHTML = `<button class="button-primary" onclick="registerEventFromOverlay(${eventId})">Kayıt Ol</button>`;
        }
        actionsEl.innerHTML = buttonsHTML;

        // Show overlay and switch to events page in background (blurred)
        showPage('events');
        overlay.style.display = 'flex';
    } catch (e) {
        console.error('Error showing event detail:', e);
    }
}

function closeEventDetail() {
    const overlay = document.getElementById('eventDetailOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        showPage('overview');
    }
}

async function registerEventFromOverlay(eventId) {
    const msgEl = document.getElementById('eventDetailMessage');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'status-info';
    }

    try {
        const res = await fetch(`${API}/members/events/${eventId}/register`, {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        });

        let data = {};
        try { data = await res.json(); } catch (_) { }

        if (res.ok) {
            if (msgEl) {
                msgEl.textContent = data.message || 'Başarıyla kaydoldunuz';
                msgEl.className = 'status-success';
            }
            // Refresh the overlay to show updated state
            setTimeout(() => showEventDetail(eventId), 1000);
        } else {
            if (msgEl) {
                msgEl.textContent = data.detail || 'Kayıt sırasında hata oluştu.';
                msgEl.className = 'status-error';
            }
        }
    } catch (e) {
        console.error(e);
        if (msgEl) {
            msgEl.textContent = 'Kayıt sırasında hata oluştu.';
            msgEl.className = 'status-error';
        }
    }
}

async function cancelEventFromOverlay(eventId) {
    const msgEl = document.getElementById('eventDetailMessage');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'status-info';
    }

    try {
        const res = await fetch(`${API}/members/events/${eventId}/register`, {
            method: 'DELETE',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        });

        let data = {};
        try { data = await res.json(); } catch (_) { }

        if (res.ok) {
            if (msgEl) {
                msgEl.textContent = data.message || 'Başvurunuz geri çekildi';
                msgEl.className = 'status-success';
            }
            // Refresh the overlay to show updated state
            setTimeout(() => showEventDetail(eventId), 1000);
        } else {
            if (msgEl) {
                msgEl.textContent = data.detail || 'Geri çekme sırasında hata oluştu.';
                msgEl.className = 'status-error';
            }
        }
    } catch (e) {
        console.error(e);
        if (msgEl) {
            msgEl.textContent = 'Geri çekme sırasında hata oluştu.';
            msgEl.className = 'status-error';
        }
    }
}

window.showEventDetail = showEventDetail;
window.closeEventDetail = closeEventDetail;
window.registerEventFromOverlay = registerEventFromOverlay;
window.cancelEventFromOverlay = cancelEventFromOverlay;
