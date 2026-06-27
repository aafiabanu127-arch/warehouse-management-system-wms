// warehouses.js
requireAuth();

let allWarehouses = [];
let allZones      = [];
let allRacks      = [];
let editingId     = null;

// ── Load user ───────────────────────────────────────────────
async function loadUser() {
  const user = await getCurrentUser();
  if (!user) return;
  document.getElementById('user-name').textContent   = user.username || '—';
  document.getElementById('user-role').textContent   = user.role     || '';
  document.getElementById('user-avatar').textContent = (user.username || '?')[0].toUpperCase();
}

// ── Toast ───────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className   = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Update stats ────────────────────────────────────────────
function updateStats() {
  const totalCap = allWarehouses.reduce((s, w) => s + (w.total_capacity || 0), 0);
  document.getElementById('stat-total').textContent    = allWarehouses.length;
  document.getElementById('stat-capacity').textContent = totalCap.toLocaleString() + ' m³';
  document.getElementById('stat-zones').textContent    = allZones.length;
  document.getElementById('stat-racks').textContent    = allRacks.length;
}

// ── Render cards ────────────────────────────────────────────
function renderGrid(list) {
  const grid = document.getElementById('wh-grid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏢</div>
        <p>No warehouses yet. Add one to get started.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(w => {
    const zones     = allZones.filter(z => z.warehouse === w.id).length;
    const racks     = allRacks.filter(r => r.zone && allZones.find(z => z.id === r.zone && z.warehouse === w.id)).length;
    const cap       = w.total_capacity  || 0;
    const used      = w.current_load    || 0;
    const utilPct   = cap > 0 ? Math.min(Math.round((used / cap) * 100), 100) : 0;
    const manager   = w.manager_name    || w.manager || '—';

    return `
    <div class="wh-card">
      <div class="wh-header">
        <div class="wh-icon">🏢</div>
        <div>
          <div class="wh-title">${w.name}</div>
          <div class="wh-loc">📍 ${w.location || '—'}</div>
        </div>
      </div>

      <div class="wh-stats">
        <div class="wh-stat">
          <div class="wh-stat-label">Capacity</div>
          <div class="wh-stat-value">${cap.toLocaleString()}<small style="font-size:11px;color:var(--text-muted)"> m³</small></div>
        </div>
        <div class="wh-stat">
          <div class="wh-stat-label">Zones</div>
          <div class="wh-stat-value">${zones}</div>
        </div>
        <div class="wh-stat">
          <div class="wh-stat-label">Racks</div>
          <div class="wh-stat-value">${racks}</div>
        </div>
        <div class="wh-stat">
          <div class="wh-stat-label">Used</div>
          <div class="wh-stat-value">${used.toLocaleString()}<small style="font-size:11px;color:var(--text-muted)"> m³</small></div>
        </div>
      </div>

      <div>
        <div class="util-label">
          <span>Utilization</span>
          <span>${utilPct}%</span>
        </div>
        <div class="util-bar-wrap">
          <div class="util-bar-fill" style="width:${utilPct}%"></div>
        </div>
      </div>

      <div class="wh-footer">
        <span class="wh-manager">👤 ${manager}</span>
        <div class="wh-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEdit(${w.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteWarehouse(${w.id})">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Filter ──────────────────────────────────────────────────
function applyFilter() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = allWarehouses.filter(w =>
    !q ||
    w.name.toLowerCase().includes(q) ||
    (w.location || '').toLowerCase().includes(q)
  );
  renderGrid(filtered);
}

// ── Load data ────────────────────────────────────────────────
async function loadData() {
  try {
    const [wRes, zRes, rRes] = await Promise.all([
      Warehouses.list(),
      Zones.list(),
      Racks.list(),
    ]);

    allWarehouses = Array.isArray(wRes) ? wRes : (wRes?.results ?? []);
    allZones      = Array.isArray(zRes) ? zRes : (zRes?.results ?? []);
    allRacks      = Array.isArray(rRes) ? rRes : (rRes?.results ?? []);

    updateStats();
    renderGrid(allWarehouses);
  } catch (err) {
    console.error(err);
    toast('Failed to load warehouses', 'error');
  }
}

// ── Modal helpers ────────────────────────────────────────────
function openModal() {
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modal-error').style.display = 'none';
  editingId = null;
}

function clearForm() {
  ['f-name','f-location','f-capacity','f-manager'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ── Add ──────────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', () => {
  editingId = null;
  clearForm();
  document.getElementById('modal-title').textContent = 'Add Warehouse';
  document.getElementById('btn-save').textContent    = 'Save';
  openModal();
});

// ── Edit ─────────────────────────────────────────────────────
function openEdit(id) {
  const w = allWarehouses.find(x => x.id === id);
  if (!w) return;
  editingId = id;

  document.getElementById('f-name').value     = w.name;
  document.getElementById('f-location').value = w.location      || '';
  document.getElementById('f-capacity').value = w.total_capacity || '';
  document.getElementById('f-manager').value  = w.manager_name  || w.manager || '';

  document.getElementById('modal-title').textContent = 'Edit Warehouse';
  document.getElementById('btn-save').textContent    = 'Update';
  openModal();
}

// ── Save ─────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const errEl = document.getElementById('modal-error');
  errEl.style.display = 'none';

  const name     = document.getElementById('f-name').value.trim();
  const location = document.getElementById('f-location').value.trim();
  const capacity = parseFloat(document.getElementById('f-capacity').value);
  const manager  = document.getElementById('f-manager').value.trim();

  if (!name || !location || isNaN(capacity) || capacity <= 0) {
    errEl.textContent   = 'Name, location and a valid capacity are required.';
    errEl.style.display = 'block';
    return;
  }

  const payload = {
    name,
    location,
    total_capacity: capacity,
    ...(manager ? { manager_name: manager } : {}),
  };

  const btn    = document.getElementById('btn-save');
  btn.disabled = true;

  try {
    if (editingId) {
      await Warehouses.update(editingId, payload);
      toast('Warehouse updated ✅');
    } else {
      await Warehouses.create(payload);
      toast('Warehouse created ✅');
    }
    closeModal();
    await loadData();
  } catch (err) {
    const msg = Object.values(err || {})[0];
    errEl.textContent   = Array.isArray(msg) ? msg[0] : (err?.detail || 'Save failed.');
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
});

// ── Delete ───────────────────────────────────────────────────
async function deleteWarehouse(id) {
  if (!confirm('Delete this warehouse? All zones and racks inside will also be removed.')) return;
  try {
    await Warehouses.delete(id);
    toast('Warehouse deleted');
    await loadData();
  } catch {
    toast('Delete failed', 'error');
  }
}

// ── Close modal ──────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ── Search ───────────────────────────────────────────────────
document.getElementById('search').addEventListener('input', applyFilter);

// ── Init ─────────────────────────────────────────────────────
loadUser();
loadData();