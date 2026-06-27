// inventory.js
requireAuth();

let allInventory = [];
let allProducts  = [];
let allShelves   = [];
let editingId    = null;

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

// ── Stock status helpers ────────────────────────────────────
function stockStatus(item) {
  const product = allProducts.find(p => p.id === item.product);
  const reorder = product?.reorder_level ?? 10;
  if (item.quantity === 0)           return 'zero';
  if (item.quantity <= reorder)      return 'low';
  return 'ok';
}

function statusBadge(item) {
  const s = stockStatus(item);
  const map = {
    zero: ['badge-red',    'Out of Stock'],
    low:  ['badge-yellow', 'Low Stock'],
    ok:   ['badge-green',  'In Stock'],
  };
  const [cls, label] = map[s];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Update stat cards ───────────────────────────────────────
function updateStats(list) {
  const total = list.length;
  const units = list.reduce((s, i) => s + (i.quantity || 0), 0);
  const low   = list.filter(i => stockStatus(i) === 'low').length;
  const zero  = list.filter(i => stockStatus(i) === 'zero').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-units').textContent = units.toLocaleString();
  document.getElementById('stat-low').textContent   = low;
  document.getElementById('stat-zero').textContent  = zero;
}

// ── Render table ────────────────────────────────────────────
function renderTable(list) {
  const body = document.getElementById('inventory-body');

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7"
      style="text-align:center;padding:40px;color:var(--text-muted)">
      No inventory records found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(item => {
    const product = allProducts.find(p => p.id === item.product);
    const shelf   = allShelves.find(s => s.id === item.shelf);
    const updated = item.last_updated
      ? new Date(item.last_updated).toLocaleString()
      : '—';

    return `
    <tr>
      <td class="bold">${product?.name ?? '—'}</td>
      <td><span class="badge badge-cyan">${product?.sku ?? '—'}</span></td>
      <td>${shelf?.shelf_code ?? shelf?.name ?? '—'}</td>
      <td>
        <span class="qty-badge">${item.quantity}</span>
      </td>
      <td>${statusBadge(item)}</td>
      <td class="text-muted">${updated}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="openEdit(${item.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord(${item.id})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Apply filter ────────────────────────────────────────────
function applyFilter() {
  const q      = document.getElementById('search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;

  const filtered = allInventory.filter(item => {
    const product = allProducts.find(p => p.id === item.product);
    const shelf   = allShelves.find(s => s.id === item.shelf);
    const name    = (product?.name  || '').toLowerCase();
    const sku     = (product?.sku   || '').toLowerCase();
    const sc      = (shelf?.shelf_code || shelf?.name || '').toLowerCase();

    const matchQ = !q || name.includes(q) || sku.includes(q) || sc.includes(q);
    const matchS = !status || stockStatus(item) === status;
    return matchQ && matchS;
  });

  renderTable(filtered);
}

// ── Populate selects ─────────────────────────────────────────
function populateSelects() {
  const pSel = document.getElementById('f-product');
  const sSel = document.getElementById('f-shelf');

  pSel.innerHTML = '<option value="">Select product…</option>' +
    allProducts.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');

  sSel.innerHTML = '<option value="">Select shelf…</option>' +
    allShelves.map(s => `<option value="${s.id}">${s.shelf_code ?? s.name}</option>`).join('');
}

// ── Load data ────────────────────────────────────────────────
async function loadData() {
  try {
    const [iRes, pRes, sRes] = await Promise.all([
      Inventory.list(),
      Products.list(),
      Shelves.list(),
    ]);

    allInventory = Array.isArray(iRes) ? iRes : (iRes?.results ?? []);
    allProducts  = Array.isArray(pRes) ? pRes : (pRes?.results ?? []);
    allShelves   = Array.isArray(sRes) ? sRes : (sRes?.results ?? []);

    updateStats(allInventory);
    populateSelects();
    renderTable(allInventory);
  } catch (err) {
    console.error(err);
    toast('Failed to load inventory', 'error');
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
  document.getElementById('f-product').value = '';
  document.getElementById('f-shelf').value   = '';
  document.getElementById('f-qty').value     = '';
}

// ── Add ──────────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', () => {
  editingId = null;
  clearForm();
  document.getElementById('modal-title').textContent = 'Add Inventory Record';
  document.getElementById('btn-save').textContent    = 'Save';
  openModal();
});

// ── Edit ─────────────────────────────────────────────────────
function openEdit(id) {
  const item = allInventory.find(x => x.id === id);
  if (!item) return;
  editingId = id;

  document.getElementById('f-product').value = item.product;
  document.getElementById('f-shelf').value   = item.shelf;
  document.getElementById('f-qty').value     = item.quantity;

  document.getElementById('modal-title').textContent = 'Edit Inventory Record';
  document.getElementById('btn-save').textContent    = 'Update';
  openModal();
}

// ── Save ─────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const errEl = document.getElementById('modal-error');
  errEl.style.display = 'none';

  const product  = parseInt(document.getElementById('f-product').value);
  const shelf    = parseInt(document.getElementById('f-shelf').value);
  const quantity = parseInt(document.getElementById('f-qty').value);

  if (!product || !shelf || isNaN(quantity) || quantity < 0) {
    errEl.textContent   = 'Product, shelf and a valid quantity are required.';
    errEl.style.display = 'block';
    return;
  }

  const btn    = document.getElementById('btn-save');
  btn.disabled = true;

  try {
    if (editingId) {
      await Inventory.update(editingId, { product, shelf, quantity });
      toast('Record updated ✅');
    } else {
      await Inventory.create({ product, shelf, quantity });
      toast('Record created ✅');
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
async function deleteRecord(id) {
  if (!confirm('Delete this inventory record?')) return;
  try {
    await Inventory.delete(id);
    toast('Record deleted');
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

// ── Events ───────────────────────────────────────────────────
document.getElementById('search').addEventListener('input', applyFilter);
document.getElementById('filter-status').addEventListener('change', applyFilter);

// ── Init ─────────────────────────────────────────────────────
loadUser();
loadData();