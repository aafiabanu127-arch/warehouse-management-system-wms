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
  if (!['admin', 'manager'].includes(role)) {
    const el = document.getElementById('nav-admin');
    if (el) el.style.display = 'none';
  }
})();

let currentPage = 1;
const PAGE_SIZE = 20;

// ── Load movements ────────────────────────────────────────────
async function loadMovements(page = 1) {
  currentPage = page;
  const type   = document.getElementById('filter-type').value;
  const from   = document.getElementById('filter-date-from').value;
  const to     = document.getElementById('filter-date-to').value;
  const search = document.getElementById('filter-search').value;

  let url = `/inventory/stock-movements/?page=${page}&page_size=${PAGE_SIZE}`;
  if (type)   url += `&movement_type=${type}`;
  if (from)   url += `&date_from=${from}`;
  if (to)     url += `&date_to=${to}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const tbody = document.getElementById('movements-body');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading…</td></tr>';

  try {
    const data = await apiFetch(url);
    const rows = data.results || data;
    const count = data.count || rows.length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px">No movements found.</td></tr>';
    } else {
      tbody.innerHTML = rows.map((m, i) => `
        <tr>
          <td class="text-muted">${(page - 1) * PAGE_SIZE + i + 1}</td>
          <td>${m.product_name || m.product || '—'}</td>
          <td><span class="badge-${m.movement_type}">${m.movement_type}</span></td>
          <td>${m.quantity}</td>
          <td>${m.shelf_name || m.shelf || '—'}</td>
          <td>${m.performed_by_name || m.performed_by || '—'}</td>
          <td>${new Date(m.timestamp || m.created_at).toLocaleDateString()}</td>
          <td class="text-muted">${m.notes || ''}</td>
        </tr>
      `).join('');
    }

    renderPagination(count, page);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px">Failed to load data.</td></tr>';
  }
}

// ── Pagination ────────────────────────────────────────────────
function renderPagination(total, current) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const el = document.getElementById('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }

  let html = `<button onclick="loadMovements(${current - 1})" ${current === 1 ? 'disabled' : ''}>‹ Prev</button>`;
  for (let p = 1; p <= pages; p++) {
    html += `<button class="${p === current ? 'active' : ''}" onclick="loadMovements(${p})">${p}</button>`;
  }
  html += `<button onclick="loadMovements(${current + 1})" ${current === pages ? 'disabled' : ''}>Next ›</button>`;
  el.innerHTML = html;
}

// ── Modal helpers ─────────────────────────────────────────────
async function openAddModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('add-modal').classList.add('active');

  // Load products
  try {
    const data = await apiFetch('/inventory/products/');
    const products = data.results || data;
    const sel = document.getElementById('m-product');
    sel.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch {}

  // Load shelves
  try {
    const data = await apiFetch('/warehouses/shelves/');
    const shelves = data.results || data;
    const sel = document.getElementById('m-shelf');
    sel.innerHTML = '<option value="">— None —</option>' +
      shelves.map(s => `<option value="${s.id}">${s.name || s.shelf_number || s.id}</option>`).join('');
  } catch {}
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('add-modal').classList.remove('active');
}

async function submitMovement() {
  const payload = {
    product:       document.getElementById('m-product').value,
    movement_type: document.getElementById('m-type').value,
    quantity:      parseInt(document.getElementById('m-qty').value),
    shelf:         document.getElementById('m-shelf').value || null,
    notes:         document.getElementById('m-notes').value,
  };

  try {
    await apiFetch('/inventory/stock-movements/', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Movement recorded ✓', 'success');
    closeModal();
    loadMovements(currentPage);
  } catch (e) {
    showToast('Failed to save movement', 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────
loadMovements();