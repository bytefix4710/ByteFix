
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

        // Check if user is an approved member of this event's club
        const clubId = event.kulup_id || event.club_id;
        const permission = window.canRegisterToEvent ? window.canRegisterToEvent(clubId) : { canRegister: false, status: 'none', message: 'Üye Değilsiniz' };

        // Populate overlay
        document.getElementById('eventDetailName').textContent = event.name || 'Etkinlik';
        document.getElementById('eventDetailClub').textContent = event.kulup_name || '';
        document.getElementById('eventDetailDate').textContent = new Date(event.datetime).toLocaleString('tr-TR');
        document.getElementById('eventDetailDescription').textContent = event.description || 'Açıklama yok.';

        // Quota section element
        const quotaSection = document.querySelector('.event-detail-quota');

        // Action buttons
        const actionsEl = document.getElementById('eventDetailActions');
        const msgEl = document.getElementById('eventDetailMessage');
        msgEl.textContent = '';
        msgEl.className = 'status-info';

        const now = new Date();
        const eventDate = new Date(event.datetime);
        const isPast = eventDate < now;
        const isRegistered = event.is_registered || false;

        // Show quota only if user is approved member
        if (permission.canRegister) {
            // Use correct API field names: capacity and remaining_quota
            const capacity = event.capacity || 0;
            const remaining = event.remaining_quota !== undefined ? event.remaining_quota : capacity;

            document.getElementById('eventDetailTotalQuota').textContent = capacity;
            document.getElementById('eventDetailRemainingQuota').textContent = remaining;

            // Show quota section
            if (quotaSection) quotaSection.style.display = 'grid';

            const isFull = remaining <= 0;

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
        } else {
            // User is not approved member - HIDE quota section completely
            if (quotaSection) quotaSection.style.display = 'none';

            actionsEl.innerHTML = '<button class="button-ghost" disabled>Kayıt Ol</button>';

            const clubName = event.kulup_name || 'Bu kulüp';
            msgEl.textContent = `${clubName} kulübüne ${permission.message.toLowerCase()}. Etkinliğe başvuramazsınız.`;
            msgEl.className = 'status-warning';
        }

        // Show overlay without changing page
        overlay.style.display = 'flex';
        document.body.classList.add('overlay-open');
    } catch (e) {
        console.error('Error showing event detail:', e);
    }
}

function closeEventDetail() {
    const overlay = document.getElementById('eventDetailOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.classList.remove('overlay-open');
    }
}

async function registerEventFromOverlay(eventId) {
    const msgEl = document.getElementById('eventDetailMessage');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'status-info';
    }

    // Check membership before attempting registration
    try {
        const evRes = await fetch(`${API}/members/events`, {
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        });
        if (evRes.ok) {
            const events = await evRes.json();
            const event = events.find(e => (e.id || e.event_id || e.etkinlik_id) == eventId);

            if (event) {
                const clubId = event.kulup_id || event.club_id;
                if (window.membershipOverview && clubId) {
                    const approved = window.membershipOverview.approved || [];
                    const isMember = approved.some(c => c.club_id === Number(clubId));

                    if (!isMember) {
                        if (msgEl) {
                            msgEl.textContent = `Bu etkinliğe katılmak için önce ${event.kulup_name || 'bu kulüp'} kulübüne üye olmalısın.`;
                            msgEl.className = 'status-error';
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
            if (window.showToast) window.showToast(data.message || 'Etkinliğe kaydınız alındı.', 'success');
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

    // Check membership before attempting cancellation
    try {
        const evRes = await fetch(`${API}/members/events`, {
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
        });
        if (evRes.ok) {
            const events = await evRes.json();
            const event = events.find(e => (e.id || e.event_id || e.etkinlik_id) == eventId);

            if (event) {
                const clubId = event.kulup_id || event.club_id;
                if (window.membershipOverview && clubId) {
                    const approved = window.membershipOverview.approved || [];
                    const isMember = approved.some(c => c.club_id === Number(clubId));

                    if (!isMember) {
                        if (msgEl) {
                            msgEl.textContent = `Bu etkinliğe katılmak için önce ${event.kulup_name || 'bu kulüp'} kulübüne üye olmalısın.`;
                            msgEl.className = 'status-error';
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
            if (window.showToast) window.showToast(data.message || 'Etkinlik başvurunuz geri çekildi.', 'success');
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
