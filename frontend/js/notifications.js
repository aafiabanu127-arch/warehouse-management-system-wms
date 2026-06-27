// ── Auth guard ────────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── User info ─────────────────────────────────────────────────
(function loadUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = user.first_name || user.username || 'User';
  const role = user.role || '';
  document.getElementById('user-name').textContent   = name;
  document.getElementById('user-role').textContent   = role;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  if (!['admin', 'manager', 'ADMIN', 'MANAGER'].includes(role)) {
    const el = document.getElementById('nav-admin');
    if (el) el.style.display = 'none';
  }
})();

// ── Load notifications ────────────────────────────────────────
async function loadNotifications() {
  const filter = document.getElementById('filter-read')?.value || '';
  const list   = document.getElementById('notif-list');
  if (list) list.innerHTML = '<div class="notif-loading">Loading…</div>';

  try {
    let url = '/notifications/notifications/';
    if (filter === 'unread') url += '?is_read=false';
    if (filter === 'read')   url += '?is_read=true';

    const data  = await apiFetch(url);
    const items = data.results || data;

    if (!list) return;

    if (!items.length) {
      list.innerHTML = '<div class="notif-empty">🎉 No notifications here.</div>';
      return;
    }

    list.innerHTML = items.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" id="notif-${n.id}">
        <div class="notif-icon">${iconFor(n.notif_type)}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
        ${!n.is_read ? `<button class="btn-mark-read" onclick="markRead(${n.id})">Mark read</button>` : ''}
      </div>
    `).join('');
  } catch (e) {
    if (list) list.innerHTML = '<div class="notif-empty">Failed to load notifications.</div>';
  }
}

async function markRead(id) {
  try {
    await apiFetch(`/notifications/notifications/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    });
    const el = document.getElementById('notif-' + id);
    if (el) {
      el.classList.remove('unread');
      const btn = el.querySelector('.btn-mark-read');
      if (btn) btn.remove();
    }
  } catch (e) {
    showToast('Could not mark as read', 'error');
  }
}

async function markAllRead() {
  try {
    await apiFetch('/notifications/notifications/mark_all_read/', { method: 'POST' });
    showToast('All marked as read ✓', 'success');
    loadNotifications();
  } catch (e) {
    // Fallback: mark individually
    showToast('Refreshing…', 'success');
    loadNotifications();
  }
}

function iconFor(type) {
  const icons = {
    LOW_STOCK:    '⚠️',
    SPACE_FULL:   '🏭',
    REPORT_READY: '📋',
    SYSTEM:       'ℹ️',
  };
  return icons[type] || '🔔';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Init ──────────────────────────────────────────────────────
loadNotifications();