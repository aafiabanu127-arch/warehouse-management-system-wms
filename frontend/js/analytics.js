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
  if (!['admin', 'manager', 'ADMIN', 'MANAGER'].includes(role)) {
    const el = document.getElementById('nav-admin');
    if (el) el.style.display = 'none';
  }
})();

// ── Tab switching ─────────────────────────────────────────────
const loaded = { abc: false, velocity: false, forecast: false, utilization: false };

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  event.target.classList.add('active');

  if (!loaded[name]) {
    loaded[name] = true;
    if (name === 'abc')         loadABC();
    if (name === 'velocity')    loadVelocity();
    if (name === 'forecast')    loadForecast();
    if (name === 'utilization') loadUtilization();
  }
}

// ── ABC Classification ────────────────────────────────────────
async function loadABC() {
  const tbody = document.getElementById('abc-body');
  try {
    const data = await apiFetch('/inventory/abc-classification/');
    const items = data.items || data.products || data;

    // Summary cards
    const counts = { A: 0, B: 0, C: 0 };
    items.forEach(i => { if (counts[i.abc_class] !== undefined) counts[i.abc_class]++; });
    document.getElementById('abc-summary').innerHTML = `
      <div class="abc-stat-card card-A">
        <div class="abc-class abc-A">Class A</div>
        <div class="abc-info">${counts.A} products — high value, tight control</div>
      </div>
      <div class="abc-stat-card card-B">
        <div class="abc-class abc-B">Class B</div>
        <div class="abc-info">${counts.B} products — moderate value</div>
      </div>
      <div class="abc-stat-card card-C">
        <div class="abc-class abc-C">Class C</div>
        <div class="abc-info">${counts.C} products — low value, bulk items</div>
      </div>
    `;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:24px">No data available.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(i => `
      <tr>
        <td>${i.product_name || i.name || '—'}</td>
        <td class="text-muted">${i.sku || '—'}</td>
        <td><span class="badge-${i.abc_class}">${i.abc_class}</span></td>
        <td>${i.total_value !== undefined ? Number(i.total_value).toLocaleString() : '—'}</td>
        <td>${i.cumulative_percentage !== undefined ? Number(i.cumulative_percentage).toFixed(1) + '%' : '—'}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:24px">Failed to load ABC data.</td></tr>';
  }
}

// ── Product Velocity ──────────────────────────────────────────
async function loadVelocity() {
  const tbody = document.getElementById('velocity-body');
  try {
    const data  = await apiFetch('/inventory/product-velocity/');
    const items = data.results || data.items || data;

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:24px">No velocity data.</td></tr>';
      return;
    }

    const max = Math.max(...items.map(i => i.total_movements || i.movement_count || 0)) || 1;

    tbody.innerHTML = items.map(i => {
      const count = i.total_movements || i.movement_count || 0;
      const pct   = Math.round((count / max) * 100);
      const label = count > max * 0.66 ? 'Fast' : count > max * 0.33 ? 'Medium' : 'Slow';
      const color = label === 'Fast' ? '#00c878' : label === 'Medium' ? 'var(--yellow)' : '#ff5050';
      return `
        <tr>
          <td>${i.product_name || i.name || '—'}</td>
          <td class="text-muted">${i.sku || '—'}</td>
          <td>${count}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="velocity-bar-wrap">
                <div class="velocity-bar" style="width:${pct}%;background:${color}"></div>
              </div>
              <span style="color:${color};font-size:12px;font-weight:600">${label}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:24px">Failed to load velocity data.</td></tr>';
  }
}

// ── Demand Forecast ───────────────────────────────────────────
async function loadForecast() {
  const tbody = document.getElementById('forecast-body');
  try {
    const data  = await apiFetch('/inventory/demand-forecast/');
    const items = Array.isArray(data) ? data : (data.product_forecasts || data.items || []);

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">No forecast data available.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(i => {
      const trend = i.trend || '';
      const tClass = trend === 'increasing' ? 'trend-up' : trend === 'decreasing' ? 'trend-down' : 'trend-flat';
      const tLabel = trend === 'increasing' ? '↑ Rising' : trend === 'decreasing' ? '↓ Falling' : '→ Stable';
      return `
        <tr>
          <td>${i.product_name || i.name || '—'}</td>
          <td class="text-muted">${i.sku || '—'}</td>
          <td>${i.avg_daily_demand !== undefined ? Number(i.avg_daily_demand).toFixed(1) : '—'}</td>
          <td>${i.forecast_30_days !== undefined ? Math.round(i.forecast_30_days) : '—'}</td>
          <td><span class="${tClass}">${tLabel}</span></td>
          <td class="text-muted">${i.confidence ? (i.confidence * 100).toFixed(0) + '%' : '—'}</td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">Failed to load forecast data.</td></tr>';
  }
}

// ── Warehouse Utilization ─────────────────────────────────────
async function loadUtilization() {
  const grid = document.getElementById('util-grid');
  try {
    const data  = await apiFetch('/inventory/warehouse-utilization/');
    const items = data.results || data.warehouses || data;

    if (!items.length) {
      grid.innerHTML = '<div class="text-muted" style="padding:24px">No utilization data.</div>';
      return;
    }

    grid.innerHTML = items.map(w => {
      const pct   = Math.min(Math.round(w.utilization_percent || w.utilization || 0), 100);
      const color = pct > 80 ? '#ff5050' : pct > 50 ? 'var(--yellow)' : 'var(--cyan)';
      return `
        <div class="util-card">
          <div class="util-name">🏢 ${w.name || w.warehouse_name || '—'}</div>
          <div class="util-track">
            <div class="util-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="util-pct">${pct}% utilised
            ${w.total_capacity ? `· ${w.total_capacity} total capacity` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="text-muted" style="padding:24px">Failed to load utilization data.</div>';
  }
}

// ── Init (load first tab) ─────────────────────────────────────
loaded.abc = true;
loadABC();