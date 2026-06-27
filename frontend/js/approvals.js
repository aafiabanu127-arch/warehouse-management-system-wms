// ── Auth guard ────────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── User info ─────────────────────────────────────────────────
let currentRole = '';
(function loadUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = user.first_name || user.username || 'User';
  currentRole = user.role || '';
  document.getElementById('user-name').textContent   = name;
  document.getElementById('user-role').textContent   = currentRole;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  if (!['admin', 'manager', 'ADMIN', 'MANAGER'].includes(currentRole)) {
    const el = document.getElementById('nav-admin');
    if (el) el.style.display = 'none';
  }
})();

const canReview = ['admin', 'manager', 'ADMIN', 'MANAGER', 'supervisor', 'SUPERVISOR'].includes(currentRole);

// ── Tab switching ─────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  btn.classList.add('active');
  if (name === 'transfers') loadTransfers();
}

// ── Adjustments ───────────────────────────────────────────────
async function loadAdjustments() {
  const status = document.getElementById('adj-filter').value;
  const tbody  = document.getElementById('adj-body');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading…</td></tr>';

  try {
    let url = '/inventory/adjustment-requests/';
    if (status) url += `?status=${status}`;
    const data  = await apiFetch(url);
    const items = data.results || data;

    // Show pending banner
    const pending = items.filter(i => i.status === 'PENDING').length;
    const banner  = document.getElementById('pending-banner');
    if (pending > 0) {
      document.getElementById('pending-count').textContent = pending;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:24px">No requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(r => `
      <tr>
        <td class="text-muted">#${r.id}</td>
        <td>${r.inventory || '—'}</td>
        <td>${r.reason || r.notes || '—'}</td>
        <td>${r.requested_by_username || r.requested_by || '—'}</td>
        <td><span class="status-${r.status}">${r.status}</span></td>
        <td class="text-muted">${new Date(r.created_at).toLocaleDateString()}</td>
        <td>
          ${r.status === 'PENDING' && canReview ? `
            <div class="action-btns">
              <button class="btn-approve" onclick="reviewAdj(${r.id}, 'approve')">✓ Approve</button>
              <button class="btn-reject"  onclick="reviewAdj(${r.id}, 'reject')">✕ Reject</button>
            </div>` : '—'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:24px">Failed to load requests.</td></tr>';
  }
}

async function reviewAdj(id, action) {
  try {
    await apiFetch(`/inventory/adjustment-requests/${id}/${action}/`, { method: 'POST' });
    showToast(action === 'approve' ? 'Request approved ✓' : 'Request rejected', action === 'approve' ? 'success' : 'error');
    loadAdjustments();
  } catch (e) {
    showToast('Action failed — check your permissions', 'error');
  }
}

// ── Transfers ─────────────────────────────────────────────────
async function loadTransfers() {
  const status = document.getElementById('tr-filter').value;
  const tbody  = document.getElementById('tr-body');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading…</td></tr>';

  try {
    let url = '/inventory/transfer-requests/';
    if (status) url += `?status=${status}`;
    const data  = await apiFetch(url);
    const items = data.results || data;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px">No transfer requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(r => `
      <tr>
        <td class="text-muted">#${r.id}</td>
        <td>${r.product_name || r.product || '—'}</td>
        <td>${r.quantity || '—'}</td>
        <td>${r.from_shelf_name || r.from_shelf || '—'}</td>
        <td>${r.to_shelf_name   || r.to_shelf   || '—'}</td>
        <td><span class="status-${r.status}">${r.status}</span></td>
        <td class="text-muted">${new Date(r.created_at || r.requested_at).toLocaleDateString()}</td>
        <td>
          ${r.status === 'PENDING' && canReview ? `
            <div class="action-btns">
              <button class="btn-approve" onclick="reviewTransfer(${r.id}, 'approve')">✓ Approve</button>
              <button class="btn-reject"  onclick="reviewTransfer(${r.id}, 'reject')">✕ Reject</button>
            </div>` : '—'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px">Failed to load transfers.</td></tr>';
  }
}

async function reviewTransfer(id, action) {
  try {
    await apiFetch(`/inventory/transfer-requests/${id}/${action}/`, { method: 'POST' });
    showToast(action === 'approve' ? 'Transfer approved ✓' : 'Transfer rejected', action === 'approve' ? 'success' : 'error');
    loadTransfers();
  } catch (e) {
    showToast('Action failed — check your permissions', 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────
loadAdjustments();