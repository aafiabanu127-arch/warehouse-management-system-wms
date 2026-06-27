// ── Auth guard ───────────────────────────────────────────────
if (!localStorage.getItem('access')) window.location.href = 'login.html';

// ── Load user info ───────────────────────────────────────────
(function loadUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = user.first_name || user.username || 'User';
  const role = user.role || '';
  document.getElementById('user-name').textContent   = name;
  document.getElementById('user-role').textContent   = role;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('topbar-sub').textContent  = `Welcome back, ${name}!`;

  // Hide admin section for non-admins
  if (!['admin', 'manager'].includes(role)) {
    const adminNav = document.getElementById('nav-admin');
    if (adminNav) adminNav.style.display = 'none';
  }
})();

// ── Date ─────────────────────────────────────────────────────
(function setDate() {
  const el = document.getElementById('topbar-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
})();

// ── Fetch helpers ────────────────────────────────────────────
async function safeGet(endpoint) {
  try {
    const data = await apiFetch(endpoint);
    return data.results || data;
  } catch (e) {
    return null;
  }
}

// ── Load all dashboard data ───────────────────────────────────
async function loadDashboard() {
  const [warehouses, products, inventory, movements, kpi] = await Promise.all([
    safeGet('/warehouses/warehouses/'),
    safeGet('/inventory/products/'),
    safeGet('/inventory/inventory/'),
    safeGet('/inventory/stock-movements/'),
    safeGet('/warehouses/kpi/'),
  ]);

  renderStats(warehouses, products, inventory);
  renderChart(kpi);
  renderLowStock(inventory);
  renderMovements(movements);
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats(warehouses, products, inventory) {
  document.getElementById('stat-warehouses').textContent =
    warehouses ? warehouses.length : '—';
  document.getElementById('stat-products').textContent =
    products ? products.length : '—';

  if (inventory) {
    const units = inventory.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);
    document.getElementById('stat-units').textContent = units.toLocaleString();

    const lowStock = inventory.filter(i =>
      i.reorder_level && parseInt(i.quantity) <= parseInt(i.reorder_level)
    );
    document.getElementById('stat-lowstock').textContent = lowStock.length;
  }
}

// ── Warehouse utilization bar chart ──────────────────────────
function renderChart(kpi) {
  const wrap = document.getElementById('chart-wrap');
  if (!kpi || !kpi.warehouses || !kpi.warehouses.length) {
    wrap.innerHTML = `<p class="text-muted text-center">No warehouse data available.</p>`;
    return;
  }

  const bars = kpi.warehouses.map(w => {
    const pct   = Math.min(w.occupancy_percentage || 0, 100);
    const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow)' : 'var(--cyan)';
    return `
      <div class="bar-row">
        <div class="bar-label" title="${w.warehouse_name}">${w.warehouse_name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%;background:${color}" data-pct="${pct}"></div>
        </div>
        <div class="bar-pct">${pct}%</div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = `<div class="bar-chart">${bars}</div>`;

  // Animate bars
  requestAnimationFrame(() => {
    wrap.querySelectorAll('.bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  });
}

// ── Low stock list ────────────────────────────────────────────
function renderLowStock(inventory) {
  const body = document.getElementById('low-stock-body');
  if (!inventory) {
    body.innerHTML = `<p class="text-muted">Could not load stock data.</p>`;
    return;
  }

  const low = inventory.filter(i =>
    i.reorder_level && parseInt(i.quantity) <= parseInt(i.reorder_level)
  ).slice(0, 8);

  if (!low.length) {
    body.innerHTML = `<p class="text-muted" style="text-align:center;padding:24px">✅ All items are sufficiently stocked.</p>`;
    return;
  }

  body.innerHTML = `
    <div class="low-stock-list">
      ${low.map(i => `
        <div class="low-stock-item">
          <span class="ls-name">${i.product_name || i.product || 'Unknown'}</span>
          <span class="ls-stock">⚠️ ${i.quantity} left</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Recent movements ──────────────────────────────────────────
function renderMovements(movements) {
  const body = document.getElementById('movements-body');
  if (!movements || !movements.length) {
    body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No movements found.</td></tr>`;
    return;
  }

  const recent = movements.slice(0, 10);

  body.innerHTML = recent.map(m => {
    const type  = (m.movement_type || m.type || '').toLowerCase();
    const badge = type === 'in'
      ? 'badge-in'
      : type === 'out'
      ? 'badge-out'
      : 'badge-transfer';

    const when = m.created_at
      ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';

    return `
      <tr>
        <td>${m.product_name || m.product || '—'}</td>
        <td><span class="badge ${badge}">${type.toUpperCase() || '—'}</span></td>
        <td>${m.quantity || '—'}</td>
        <td style="color:var(--text-muted);font-size:12px">${when}</td>
      </tr>
    `;
  }).join('');
}

// ── Init ──────────────────────────────────────────────────────
loadDashboard();