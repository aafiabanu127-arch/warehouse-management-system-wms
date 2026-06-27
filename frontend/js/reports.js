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

// ── Load report list ──────────────────────────────────────────
async function loadReports() {
  const tbody = document.getElementById('reports-body');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Loading…</td></tr>';

  try {
    const data    = await apiFetch('/reports/reports/');
    const reports = data.results || data;

    if (!reports.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">No reports yet. Click a card above to generate one.</td></tr>';
      return;
    }

    tbody.innerHTML = reports.map(r => `
      <tr>
        <td>${r.title}</td>
        <td>${r.report_type}</td>
        <td><span class="status-${r.status}">${r.status}</span></td>
        <td class="text-muted">${r.generated_by || '—'}</td>
        <td class="text-muted">${new Date(r.created_at).toLocaleDateString()}</td>
        <td>
          ${r.status === 'COMPLETED' ? `
            <div class="export-btns">
              <a class="btn-xs" href="${getApiBase()}/reports/reports/${r.id}/export_csv/"    target="_blank">CSV</a>
              <a class="btn-xs" href="${getApiBase()}/reports/reports/${r.id}/export_excel/"  target="_blank">XLS</a>
              <a class="btn-xs" href="${getApiBase()}/reports/reports/${r.id}/export_pdf/"    target="_blank">PDF</a>
            </div>` : '—'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">Failed to load reports.</td></tr>';
  }
}

function getApiBase() {
  return window.API_BASE || 'http://localhost:8000/api';
}

// ── Modal ─────────────────────────────────────────────────────
function openNewModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('new-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('new-modal').classList.remove('active');
}

function quickGenerate(type) {
  const labels = {
    INVENTORY: 'Inventory Report',
    WAREHOUSE: 'Warehouse Utilization',
    STOCK:     'Stock Movement Report',
    SPACE:     'Space Optimization Report',
  };
  document.getElementById('r-title').value = labels[type] + ' — ' + new Date().toLocaleDateString();
  document.getElementById('r-type').value  = type;
  openNewModal();
}

async function generateReport() {
  const title = document.getElementById('r-title').value.trim();
  const type  = document.getElementById('r-type').value;

  if (!title) { showToast('Please enter a report title', 'error'); return; }

  try {
    await apiFetch('/reports/reports/', {
      method: 'POST',
      body: JSON.stringify({ title, report_type: type }),
    });
    showToast('Report generated ✓', 'success');
    closeModal();
    loadReports();
  } catch (e) {
    showToast('Failed to generate report', 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────
loadReports();