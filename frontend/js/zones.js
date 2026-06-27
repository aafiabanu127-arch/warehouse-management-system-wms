// ── Auth guard ───────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── State ────────────────────────────────────────────────────
let allZones      = [];
let allWarehouses = [];
let editingId     = null;
let deletingId    = null;

// ── DOM refs ─────────────────────────────────────────────────
const zonesBody       = document.getElementById('zones-body');
const searchEl        = document.getElementById('search');
const filterWarehouse = document.getElementById('filter-warehouse');
const modal           = document.getElementById('modal');
const modalTitle      = document.getElementById('modal-title');
const confirmModal    = document.getElementById('confirm-modal');
const confirmName     = document.getElementById('confirm-name');

// ── Load user info ───────────────────────────────────────────
(function loadUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = user.first_name || user.username || 'User';
  const role = user.role || '';
  document.getElementById('user-name').textContent   = name;
  document.getElementById('user-role').textContent   = role;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
})();

// ── Fetch warehouses for dropdowns ──────────────────────────
async function loadWarehouses() {
  try {
    const data = await apiFetch('/warehouses/warehouses/');
    allWarehouses = data.results || data;

    // Populate filter dropdown
    allWarehouses.forEach(w => {
      const opt = document.createElement('option');
      opt.value       = w.id;
      opt.textContent = w.name;
      filterWarehouse.appendChild(opt);
    });

    // Populate modal dropdown
    populateWarehouseSelect();
  } catch (e) {
    console.error('Failed to load warehouses', e);
  }
}

function populateWarehouseSelect() {
  const sel = document.getElementById('f-warehouse');
  sel.innerHTML = '<option value="">Select warehouse…</option>';
  allWarehouses.forEach(w => {
    const opt = document.createElement('option');
    opt.value       = w.id;
    opt.textContent = w.name;
    sel.appendChild(opt);
  });
}

// ── Fetch zones ──────────────────────────────────────────────
async function loadZones() {
  try {
    const data = await apiFetch('/warehouses/zones/');
    allZones = data.results || data;
    updateStats();
    renderTable();
  } catch (e) {
    zonesBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Failed to load zones.</td></tr>`;
  }
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-total').textContent =
    allZones.length;
  document.getElementById('stat-capacity').textContent =
    allZones.reduce((s, z) => s + parseFloat(z.capacity || 0), 0).toLocaleString();
  const uniqueWh = new Set(allZones.map(z => z.warehouse));
  document.getElementById('stat-warehouses').textContent =
    uniqueWh.size;
}

// ── Render table ─────────────────────────────────────────────
function renderTable() {
  const q  = searchEl.value.trim().toLowerCase();
  const wh = filterWarehouse.value;

  const filtered = allZones.filter(z => {
    const matchQ  = !q  || z.name.toLowerCase().includes(q);
    const matchWh = !wh || String(z.warehouse) === wh;
    return matchQ && matchWh;
  });

  if (!filtered.length) {
    zonesBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No zones found.</td></tr>`;
    return;
  }

  const whMap = Object.fromEntries(allWarehouses.map(w => [w.id, w.name]));

  zonesBody.innerHTML = filtered.map(z => `
    <tr>
      <td><strong>${z.name}</strong></td>
      <td><span class="badge badge-cyan">${whMap[z.warehouse] || z.warehouse}</span></td>
      <td>${parseFloat(z.capacity).toLocaleString()} units</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="openEdit(${z.id})">✏️ Edit</button>
          <button class="btn-icon" onclick="openDelete(${z.id}, '${z.name}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Modal helpers ────────────────────────────────────────────
function openModal() { modal.style.display = 'flex'; }
function closeModal() {
  modal.style.display = 'none';
  editingId = null;
  document.getElementById('f-name').value      = '';
  document.getElementById('f-warehouse').value = '';
  document.getElementById('f-capacity').value  = '';
}

function openAdd() {
  modalTitle.textContent = 'Add Zone';
  populateWarehouseSelect();
  openModal();
}

function openEdit(id) {
  const z = allZones.find(x => x.id === id);
  if (!z) return;
  editingId = id;
  modalTitle.textContent = 'Edit Zone';
  populateWarehouseSelect();
  document.getElementById('f-name').value      = z.name;
  document.getElementById('f-warehouse').value = z.warehouse;
  document.getElementById('f-capacity').value  = z.capacity;
  openModal();
}

function openDelete(id, name) {
  deletingId = id;
  confirmName.textContent = name;
  confirmModal.style.display = 'flex';
}

function closeConfirm() {
  confirmModal.style.display = 'none';
  deletingId = null;
}

// ── Save (add/edit) ──────────────────────────────────────────
async function saveZone() {
  const name      = document.getElementById('f-name').value.trim();
  const warehouse = document.getElementById('f-warehouse').value;
  const capacity  = document.getElementById('f-capacity').value;

  if (!name || !warehouse || !capacity) {
    showToast('Please fill in all fields.', 'error'); return;
  }

  const payload = { name, warehouse: parseInt(warehouse), capacity: parseFloat(capacity) };
  const btnSave = document.getElementById('btn-save');
  btnSave.disabled = true;

  try {
    if (editingId) {
      await apiFetch(`/warehouses/zones/${editingId}/`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Zone updated!', 'success');
    } else {
      await apiFetch('/warehouses/zones/', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Zone added!', 'success');
    }
    closeModal();
    await loadZones();
  } catch (e) {
    showToast('Save failed. Please try again.', 'error');
  } finally {
    btnSave.disabled = false;
  }
}

// ── Delete ───────────────────────────────────────────────────
async function deleteZone() {
  if (!deletingId) return;
  const btnDel = document.getElementById('confirm-delete');
  btnDel.disabled = true;

  try {
    await apiFetch(`/warehouses/zones/${deletingId}/`, { method: 'DELETE' });
    showToast('Zone deleted.', 'success');
    closeConfirm();
    await loadZones();
  } catch (e) {
    showToast('Delete failed.', 'error');
  } finally {
    btnDel.disabled = false;
  }
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast-container');
  const d = document.createElement('div');
  d.className = `toast toast-${type}`;
  d.textContent = msg;
  t.appendChild(d);
  setTimeout(() => d.remove(), 3000);
}

// ── Events ───────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', openAdd);
document.getElementById('btn-save').addEventListener('click', saveZone);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('confirm-delete').addEventListener('click', deleteZone);
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-close').addEventListener('click', closeConfirm);
searchEl.addEventListener('input', renderTable);
filterWarehouse.addEventListener('change', renderTable);

// ── Init ─────────────────────────────────────────────────────
loadWarehouses().then(loadZones);