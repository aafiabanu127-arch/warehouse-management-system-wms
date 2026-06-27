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
  // Redirect non-admins away
  if (!['admin', 'manager', 'ADMIN', 'MANAGER'].includes(role)) {
    window.location.href = 'dashboard.html';
  }
})();

let allUsers = [];

// ── Load users ────────────────────────────────────────────────
async function loadUsers() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const tbody  = document.getElementById('users-body');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Loading…</td></tr>';

  try {
    if (!allUsers.length) {
      const data = await apiFetch('/users/users/');
      allUsers = data.results || data;
    }

    const filtered = allUsers.filter(u =>
      u.username.toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search) ||
      (u.department || '').toLowerCase().includes(search)
    );

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar">${u.username.charAt(0).toUpperCase()}</div>
            <span>${u.username}</span>
          </div>
        </td>
        <td class="text-muted">${u.email || '—'}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${u.department || '—'}</td>
        <td>${u.phone || '—'}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openEditModal(${u.id})">✏️ Edit</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">Failed to load users.</td></tr>';
  }
}

// ── Modal ─────────────────────────────────────────────────────
function openEditModal(id) {
  const u = allUsers.find(u => u.id === id);
  if (!u) return;
  document.getElementById('edit-id').value         = u.id;
  document.getElementById('edit-username').value   = u.username;
  document.getElementById('edit-email').value      = u.email || '';
  document.getElementById('edit-role').value       = u.role;
  document.getElementById('edit-department').value = u.department || '';
  document.getElementById('edit-phone').value      = u.phone || '';
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('edit-modal').classList.remove('active');
}

async function saveUser() {
  const id = document.getElementById('edit-id').value;
  const payload = {
    role:       document.getElementById('edit-role').value,
    department: document.getElementById('edit-department').value,
    phone:      document.getElementById('edit-phone').value,
  };

  try {
    await apiFetch(`/users/users/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
    showToast('User updated ✓', 'success');
    allUsers = []; // clear cache
    closeModal();
    loadUsers();
  } catch (e) {
    showToast('Failed to update user', 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────
loadUsers();