// ── Auth guard ───────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── State ────────────────────────────────────────────────────
let allShelves = [];
let allRacks   = [];
let editingId  = null;
let deletingId = null;

// ── DOM refs ─────────────────────────────────────────────────
const shelvesBody  = document.getElementById('shelves-body');
const searchEl     = document.getElementById('search');
const filterRack   = document.getElementById('filter-rack');
const modal        = document.getElementById('modal');
const modalTitle   = document.getElementById('modal-title');
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

// ── Fetch racks for dropdowns ────────────────────────────────
async function loadRacks() {
  try {
    const data = await apiFetch('/warehouses/racks/');
    allRacks = data.results || data;

    allRacks.forEach(r => {
      const opt = document.createElement('option');
      opt.value       = r.id;
      opt.textContent = r.rack_code;
      filterRack.appendChild(opt);
    });

    populateRackSelect();
  } catch (e) {
    console.error('Failed to load racks', e);
  }
}

function populateRackSelect() {
  const sel = document.getElementById('f-rack');
  sel.innerHTML = '<option value="">Select rack…</option>';
  allRacks.forEach(r => {
    const opt = document.createElement('option');
    opt.value       = r.id;
    opt.textContent = r.rack_code;
    sel.appendChild(opt);
  });
}

// ── Fetch shelves ────────────────────────────────────────────
async function loadShelves() {
  try {
    const data = await apiFetch('/warehouses/shelves/');
    allShelves = data.results || data;
    updateStats();
    renderTable();
  } catch (e) {
    shelvesBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Failed to load shelves.</td></tr>`;
  }
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  const totalCap  = allShelves.reduce((s, sh) => s + parseFloat(sh.capacity || 0), 0);
  const totalOcc  = allShelves.reduce((s, sh) => s + parseFloat(sh.occupied_capacity || 0), 0);
  const avgOcc    = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

  document.getElementById('stat-total').textContent    = allShelves.length;
  document.getElementById('stat-capacity').textContent = totalCap.toLocaleString();
  document.getElementById('stat-occupied').textContent = totalOcc.toLocaleString();
  document.getElementById('stat-avg').textContent      = avgOcc + '%';
}

// ── Occupancy color ──────────────────────────────────────────
function occColor(pct) {
  if (pct >= 90) return '#f87171';
  if (pct >= 70) return '#fbbf24';
  return '#34d399';
}

function occBadgeClass(pct) {
  if (pct >= 90) return 'badge-danger';
  if (pct >= 70) return 'badge-warn';
  return 'badge-ok';
}

// ── Render table ─────────────────────────────────────────────
function renderTable() {
  const q  = searchEl.value.trim().toLowerCase();
  const rf = filterRack.value;

  const filtered = allShelves.filter(sh => {
    const matchQ = !q  || sh.shelf_code.toLowerCase().includes(q);
    const matchR = !rf || String(sh.rack) === rf;
    return matchQ && matchR;
  });

  if (!filtered.length) {
    shelvesBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No shelves found.</td></tr>`;
    return;
  }

  const rackMap = Object.fromEntries(allRacks.map(r => [r.id, r.rack_code]));

  shelvesBody.innerHTML = filtered.map(sh => {
    const cap  = parseFloat(sh.capacity || 0);
    const occ  = parseFloat(sh.occupied_capacity || 0);
    const pct  = cap > 0 ? Math.round((occ / cap) * 100) : 0;
    const color = occColor(pct);

    return `
      <tr>
        <td><strong>${sh.shelf_code}</strong></td>
        <td><span class="badge badge-teal">${rackMap[sh.rack] || sh.rack}</span></td>
        <td>${cap.toLocaleString()} units</td>
        <td>${occ.toLocaleString()} units</td>
        <td>
          <div class="occ-wrap">
            <div class="occ-bar">
              <div class="occ-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span class="occ-label">${pct}%</span>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openEdit(${sh.id})">✏️ Edit</button>
            <button class="btn-icon" onclick="openDelete(${sh.id}, '${sh.shelf_code}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Modal helpers ────────────────────────────────────────────
function openModal() { modal.style.display = 'flex'; }
function closeModal() {
  modal.style.display = 'none';
  editingId = null;
  document.getElementById('f-code').value     = '';
  document.getElementById('f-rack').value     = '';
  document.getElementById('f-capacity').value = '';
  document.getElementById('f-occupied').value = '';
}

function openAdd() {
  modalTitle.textContent = 'Add Shelf';
  populateRackSelect();
  openModal();
}

function openEdit(id) {
  const sh = allShelves.find(x => x.id === id);
  if (!sh) return;
  editingId = id;
  modalTitle.textContent = 'Edit Shelf';
  populateRackSelect();
  document.getElementById('f-code').value     = sh.shelf_code;
  document.getElementById('f-rack').value     = sh.rack;
  document.getElementById('f-capacity').value = sh.capacity;
  document.getElementById('f-occupied').value = sh.occupied_capacity || 0;
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
async function saveShelf() {
  const code     = document.getElementById('f-code').value.trim();
  const rack     = document.getElementById('f-rack').value;
  const capacity = document.getElementById('f-capacity').value;
  const occupied = document.getElementById('f-occupied').value || 0;

  if (!code || !rack || !capacity) {
    showToast('Please fill in all required fields.', 'error'); return;
  }

  const payload = {
    shelf_code:        code,
    rack:              parseInt(rack),
    capacity:          parseFloat(capacity),
    occupied_capacity: parseFloat(occupied),
  };

  const btnSave = document.getElementById('btn-save');
  btnSave.disabled = true;

  try {
    if (editingId) {
      await apiFetch(`/warehouses/shelves/${editingId}/`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Shelf updated!', 'success');
    } else {
      await apiFetch('/warehouses/shelves/', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Shelf added!', 'success');
    }
    closeModal();
    await loadShelves();
  } catch (e) {
    showToast('Save failed. Please try again.', 'error');
  } finally {
    btnSave.disabled = false;
  }
}

// ── Delete ───────────────────────────────────────────────────
async function deleteShelf() {
  if (!deletingId) return;
  const btnDel = document.getElementById('confirm-delete');
  btnDel.disabled = true;

  try {
    await apiFetch(`/warehouses/shelves/${deletingId}/`, { method: 'DELETE' });
    showToast('Shelf deleted.', 'success');
    closeConfirm();
    await loadShelves();
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
document.getElementById('btn-save').addEventListener('click', saveShelf);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('confirm-delete').addEventListener('click', deleteShelf);
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-close').addEventListener('click', closeConfirm);
searchEl.addEventListener('input', renderTable);
filterRack.addEventListener('change', renderTable);

// ── Init ─────────────────────────────────────────────────────
loadRacks().then(loadShelves);