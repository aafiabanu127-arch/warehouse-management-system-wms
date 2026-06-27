// categories.js
requireAuth();

let allCategories = [];
let allProducts   = [];
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

// ── Count products per category ─────────────────────────────
function productCount(catId) {
  return allProducts.filter(p => p.category === catId).length;
}

// ── Render grid ─────────────────────────────────────────────
function renderGrid(list) {
  const grid = document.getElementById('cat-grid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏷️</div>
        <p>No categories yet. Add one to get started.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(c => `
    <div class="cat-card">
      <div class="cat-icon">🏷️</div>
      <div class="cat-name">${c.name}</div>
      <div class="cat-desc">${c.description || '<em style="opacity:.5">No description</em>'}</div>
      <div class="cat-meta">
        <span class="cat-count">${productCount(c.id)} product${productCount(c.id) !== 1 ? 's' : ''}</span>
        <div class="cat-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEdit(${c.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Filter ──────────────────────────────────────────────────
function applyFilter() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = allCategories.filter(c =>
    !q || c.name.toLowerCase().includes(q) ||
    (c.description || '').toLowerCase().includes(q)
  );
  renderGrid(filtered);
}

// ── Load data ────────────────────────────────────────────────
async function loadData() {
  try {
    const [cRes, pRes] = await Promise.all([
      Categories.list(),
      Products.list(),
    ]);

    allCategories = Array.isArray(cRes) ? cRes : (cRes?.results ?? []);
    allProducts   = Array.isArray(pRes) ? pRes : (pRes?.results ?? []);

    renderGrid(allCategories);
  } catch (err) {
    console.error(err);
    toast('Failed to load categories', 'error');
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
  document.getElementById('f-name').value = '';
  document.getElementById('f-desc').value = '';
}

// ── Add ──────────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', () => {
  editingId = null;
  clearForm();
  document.getElementById('modal-title').textContent = 'Add Category';
  document.getElementById('btn-save').textContent    = 'Save';
  openModal();
});

// ── Edit ─────────────────────────────────────────────────────
function openEdit(id) {
  const c = allCategories.find(x => x.id === id);
  if (!c) return;
  editingId = id;

  document.getElementById('f-name').value = c.name;
  document.getElementById('f-desc').value = c.description || '';

  document.getElementById('modal-title').textContent = 'Edit Category';
  document.getElementById('btn-save').textContent    = 'Update';
  openModal();
}

// ── Save ─────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const errEl = document.getElementById('modal-error');
  errEl.style.display = 'none';

  const name = document.getElementById('f-name').value.trim();
  const desc = document.getElementById('f-desc').value.trim();

  if (!name) {
    errEl.textContent   = 'Category name is required.';
    errEl.style.display = 'block';
    return;
  }

  const btn    = document.getElementById('btn-save');
  btn.disabled = true;

  try {
    if (editingId) {
      await Categories.update(editingId, { name, description: desc });
      toast('Category updated ✅');
    } else {
      await Categories.create({ name, description: desc });
      toast('Category created ✅');
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
async function deleteCategory(id) {
  const count = productCount(id);
  const warn  = count > 0
    ? `\n\nWarning: ${count} product(s) are in this category.`
    : '';
  if (!confirm(`Delete this category?${warn}`)) return;

  try {
    await Categories.delete(id);
    toast('Category deleted');
    await loadData();
  } catch {
    toast('Delete failed — category may have linked products', 'error');
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