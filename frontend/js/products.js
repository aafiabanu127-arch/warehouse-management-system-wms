// products.js
requireAuth();

let allProducts   = [];
let allCategories = [];
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
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Render table ────────────────────────────────────────────
function renderTable(list) {
  const body = document.getElementById('products-body');
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No products found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(p => {
    const cat = allCategories.find(c => c.id === p.category);
    return `
    <tr>
      <td class="bold">${p.name}</td>
      <td><span class="badge badge-cyan">${p.sku}</span></td>
      <td>${cat ? cat.name : '—'}</td>
      <td>$${parseFloat(p.unit_price || 0).toFixed(2)}</td>
      <td>${p.unit_volume} m³</td>
      <td>${p.unit_weight} kg</td>
      <td>${p.reorder_level ?? 10}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-ghost btn-sm" onclick="openEdit(${p.id})">✏️ Edit</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Filter ──────────────────────────────────────────────────
function applyFilter() {
  const q   = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('filter-category').value;

  const filtered = allProducts.filter(p => {
    const matchQ   = !q   || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = !cat || String(p.category) === cat;
    return matchQ && matchCat;
  });
  renderTable(filtered);
}

// ── Populate category dropdowns ──────────────────────────────
function populateCategoryDropdowns() {
  const filterSel = document.getElementById('filter-category');
  const formSel   = document.getElementById('f-category');

  allCategories.forEach(c => {
    filterSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    formSel.innerHTML   += `<option value="${c.id}">${c.name}</option>`;
  });
}

// ── Load data ────────────────────────────────────────────────
async function loadData() {
  try {
    const [pRes, cRes] = await Promise.all([
      Products.list(),
      Categories.list(),
    ]);

    allProducts   = Array.isArray(pRes) ? pRes : (pRes?.results ?? []);
    allCategories = Array.isArray(cRes) ? cRes : (cRes?.results ?? []);

    populateCategoryDropdowns();
    renderTable(allProducts);
  } catch (err) {
    console.error(err);
    toast('Failed to load products', 'error');
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
  ['f-name','f-sku','f-desc','f-price','f-volume','f-weight','f-reorder'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-category').value = '';
}

// ── Open Add ─────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', () => {
  editingId = null;
  clearForm();
  document.getElementById('modal-title').textContent = 'Add Product';
  document.getElementById('btn-save').textContent    = 'Save Product';
  openModal();
});

// ── Open Edit ────────────────────────────────────────────────
function openEdit(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;

  document.getElementById('f-name').value    = p.name;
  document.getElementById('f-sku').value     = p.sku;
  document.getElementById('f-desc').value    = p.description || '';
  document.getElementById('f-price').value   = p.unit_price  || 0;
  document.getElementById('f-volume').value  = p.unit_volume || 0;
  document.getElementById('f-weight').value  = p.unit_weight || 0;
  document.getElementById('f-reorder').value = p.reorder_level ?? 10;
  document.getElementById('f-category').value = String(p.category);

  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('btn-save').textContent    = 'Update Product';
  openModal();
}

// ── Save ─────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const errEl = document.getElementById('modal-error');
  errEl.style.display = 'none';

  const payload = {
    name:          document.getElementById('f-name').value.trim(),
    sku:           document.getElementById('f-sku').value.trim(),
    description:   document.getElementById('f-desc').value.trim(),
    category:      parseInt(document.getElementById('f-category').value),
    unit_price:    parseFloat(document.getElementById('f-price').value)  || 0,
    unit_volume:   parseFloat(document.getElementById('f-volume').value) || 0,
    unit_weight:   parseFloat(document.getElementById('f-weight').value) || 0,
    reorder_level: parseInt(document.getElementById('f-reorder').value)  || 10,
  };

  if (!payload.name || !payload.sku || !payload.category) {
    errEl.textContent    = 'Name, SKU and Category are required.';
    errEl.style.display  = 'block';
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;

  try {
    if (editingId) {
      await Products.update(editingId, payload);
      toast('Product updated ✅');
    } else {
      await Products.create(payload);
      toast('Product created ✅');
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
async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await Products.delete(id);
    toast('Product deleted');
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

// ── Search / filter events ───────────────────────────────────
document.getElementById('search').addEventListener('input', applyFilter);
document.getElementById('filter-category').addEventListener('change', applyFilter);

// ── Init ─────────────────────────────────────────────────────
loadUser();
loadData();