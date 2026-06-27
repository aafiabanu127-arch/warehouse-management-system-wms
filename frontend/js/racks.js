// ── Auth guard ───────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── State ────────────────────────────────────────────────────
let allRacks = [];
let allZones = [];
let editingId  = null;
let deletingId = null;

// ── DOM refs ─────────────────────────────────────────────────
const racksBody  = document.getElementById('racks-body');
const searchEl   = document.getElementById('search');
const filterZone = document.getElementById('filter-zone');
const modal      = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const confirmModal = document.getElementById('confirm-modal');
const confirmName  = document.getElementById('confirm-name');

// ── Load user info ───────────────────────────────────────────
(function loadUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = user.first_name || user.username || 'User';
  const role = user.role || '';
  document.getElementById('user-name').textContent   = name;
  document.getElementById('user-role').textContent   = role;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
})();

// ── Fetch zones for dropdowns ────────────────────────────────
async function loadZones() {
  try {
    const data = await apiFetch('/warehouses/zones/');
    allZones = data.results || data;

    allZones.forEach(z => {
      const opt = document.createElement('option');
      opt.value       = z.id;
      opt.textContent = z.name;
      filterZone.appendChild(opt);
    });

    populateZoneSelect();
  } catch (e) {
    console.error('Failed to load zones', e);
  }
}

function populateZoneSelect() {
  const sel = document.getElementById('f-zone');
  sel.innerHTML = '<option value="">Select zone…</option>';
  allZones.forEach(z => {
    const opt = document.createElement('option');
    opt.value       = z.id;
    opt.textContent = z.name;
    sel.appendChild(opt);
  });
}

// ── Fetch racks ──────────────────────────────────────────────
async function loadRacks() {
  try {
    const data = await apiFetch('/warehouses/racks/');
    allRacks = data.results || data;
    updateStats();
    renderTable();
  } catch (e) {
    racksBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Failed to load racks.</td></tr>`;
  }
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-total').textContent =
    allRacks.length;
  document.getElementById('stat-capacity').textContent =
    allRacks.reduce((s, r) => s + parseFloat(r.capacity || 0), 0).toLocaleString();
  const uniqueZones = new Set(allRacks.map(r => r.zone));
  document.getElementById('stat-zones').textContent =
    uniqueZones.size;
}

// ── Render table ─────────────────────────────────────────────
function renderTable() {
  const q  = searchEl.value.trim().toLowerCase();
  const zf = filterZone.value;

  const filtered = allRacks.filter(r => {
    const matchQ = !q  || r.rack_code.toLowerCase().includes(q);
    const matchZ = !zf || String(r.zone) === zf;
    return matchQ && matchZ;
  });

  if (!filtered.length) {
    racksBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No racks found.</td></tr>`;
    return;
  }

  const zoneMap = Object.fromEntries(allZones.map(z => [z.id, z.name]));

  racksBody.innerHTML = filtered.map(r => `
    <tr>
      <td><strong>${r.rack_code}</strong></td>
      <td><span class="badge badge-teal">${zoneMap[r.zone] || r.zone}</span></td>
      <td>${parseFloat(r.capacity).toLocaleString()} units</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="openEdit(${r.id})">✏️ Edit</button>
          <button class="btn-icon" onclick="openDelete(${r.id}, '${r.rack_code}')">🗑️ Delete</button>
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
  document.getElementById('f-code').value     = '';
  document.getElementById('f-zone').value     = '';
  document.getElementById('f-capacity').value = '';
}

function openAdd() {
  modalTitle.textContent = 'Add Rack';
  populateZoneSelect();
  openModal();
}

function openEdit(id) {
  const r = allRacks.find(x => x.id === id);
  if (!r) return;
  editingId = id;
  modalTitle.textContent = 'Edit Rack';
  populateZoneSelect();
  document.getElementById('f-code').value     = r.rack_code;
  document.getElementById('f-zone').value     = r.zone;
  document.getElementById('f-capacity').value = r.capacity;
  openModal();
}

function openDelete(id, code) {
  deletingId = id;
  confirmName.textContent = code;
  confirmModal.style.display = 'flex';
}

function closeConfirm() {
  confirmModal.style.display = 'none';
  deletingId = null;
}

// ── Save ─────────────────────────────────────────────────────
async function saveRack() {
  const code     = document.getElementById('f-code').value.trim();
  const zone     = document.getElementById('f-zone').value;
  const capacity = document.getElementById('f-capacity').value;

  if (!code || !zone || !capacity) {
    showToast('Please fill in all fields.', 'error'); return;
  }

  const payload = { rack_code: code, zone: parseInt(zone), capacity: parseFloat(capacity) };
  const btnSave = document.getElementById('btn-save');
  btnSave.disabled = true;

  try {
    if (editingId) {
      await apiFetch(`/warehouses/racks/${editingId}/`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Rack updated!', 'success');
    } else {
      await apiFetch('/warehouses/racks/', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Rack added!', 'success');
    }
    closeModal();
    await loadRacks();
  } catch (e) {
    showToast('Save failed. Please try again.', 'error');
  } finally {
    btnSave.disabled = false;
  }
}

// ── Delete ───────────────────────────────────────────────────
async function deleteRack() {
  if (!deletingId) return;
  const btnDel = document.getElementById('confirm-delete');
  btnDel.disabled = true;

  try {
    await apiFetch(`/warehouses/racks/${deletingId}/`, { method: 'DELETE' });
    showToast('Rack deleted.', 'success');
    closeConfirm();
    await loadRacks();
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
document.getElementById('btn-save').addEventListener('click', saveRack);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('confirm-delete').addEventListener('click', deleteRack);
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-close').addEventListener('click', closeConfirm);
searchEl.addEventListener('input', renderTable);
filterZone.addEventListener('change', renderTable);

// ── Init ─────────────────────────────────────────────────────
loadZones().then(loadRacks);