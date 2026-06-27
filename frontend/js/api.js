// ============================================================
//  api.js  —  Shared API helper for Warehouse Management System
// ============================================================

const BASE_URL = 'http://127.0.0.1:8000/api';

// ── Token helpers ────────────────────────────────────────────
function getAccessToken()  { return localStorage.getItem('access');  }
function getRefreshToken() { return localStorage.getItem('refresh'); }

function saveTokens(access, refresh) {
  localStorage.setItem('access',  access);
  localStorage.setItem('refresh', refresh);
}

function clearTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
}

// ── Auto-refresh access token ────────────────────────────────
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/token/refresh/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh }),
  });

  if (!res.ok) { clearTokens(); return null; }

  const data = await res.json();
  localStorage.setItem('access', data.access);
  return data.access;
}

// ── Core fetch wrapper ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  let token = getAccessToken();

  const makeRequest = async (t) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  };

  let res = await makeRequest(token);

  // If 401 → try refresh once
  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) { redirectToLogin(); return null; }
    res = await makeRequest(token);
  }

  if (res.status === 401) { redirectToLogin(); return null; }

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// ── Auth calls ───────────────────────────────────────────────
async function login(username, password) {
  const res = await fetch(`${BASE_URL}/token/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  saveTokens(data.access, data.refresh);
  return data;
}

async function register(payload) {
  const res = await fetch(`${BASE_URL}/users/register/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

function logout() {
  clearTokens();
  window.location.href = '../pages/login.html';
}

// ── Current user ─────────────────────────────────────────────
async function getCurrentUser() {
  const cached = localStorage.getItem('user');
  if (cached) return JSON.parse(cached);
  const user = await apiFetch('/users/me/');
  if (user) localStorage.setItem('user', JSON.stringify(user));
  return user;
}

// ── Guard: redirect if not logged in ─────────────────────────
function requireAuth() {
  if (!getAccessToken()) redirectToLogin();
}

function redirectToLogin() {
  clearTokens();
  window.location.href = '../pages/login.html';
}

// ── CRUD helpers ─────────────────────────────────────────────
const api = {
  get:    (url)          => apiFetch(url),
  post:   (url, body)    => apiFetch(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)    => apiFetch(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body)    => apiFetch(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)          => apiFetch(url, { method: 'DELETE' }),
};

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard = {
  getSummary: () => api.get('/inventory/warehouse-utilization/'),
};

// ── Categories ───────────────────────────────────────────────
const Categories = {
  list:   ()       => api.get('/inventory/categories/'),
  create: (data)   => api.post('/inventory/categories/', data),
  update: (id, d)  => api.put(`/inventory/categories/${id}/`, d),
  delete: (id)     => api.delete(`/inventory/categories/${id}/`),
};

// ── Products ─────────────────────────────────────────────────
const Products = {
  list:   ()       => api.get('/inventory/products/'),
  create: (data)   => api.post('/inventory/products/', data),
  update: (id, d)  => api.put(`/inventory/products/${id}/`, d),
  delete: (id)     => api.delete(`/inventory/products/${id}/`),
};

// ── Inventory ────────────────────────────────────────────────
const Inventory = {
  list:   ()       => api.get('/inventory/inventory/'),
  create: (data)   => api.post('/inventory/inventory/', data),
  update: (id, d)  => api.put(`/inventory/inventory/${id}/`, d),
  delete: (id)     => api.delete(`/inventory/inventory/${id}/`),
};

// ── Stock Movements ──────────────────────────────────────────
const StockMovements = {
  list:   ()       => api.get('/inventory/stock-movements/'),
  create: (data)   => api.post('/inventory/stock-movements/', data),
};

// ── Warehouses ───────────────────────────────────────────────
const Warehouses = {
  list:   ()       => api.get('/warehouses/'),
  create: (data)   => api.post('/warehouses/', data),
  update: (id, d)  => api.put(`/warehouses/${id}/`, d),
  delete: (id)     => api.delete(`/warehouses/${id}/`),
};

// ── Zones ────────────────────────────────────────────────────
const Zones = {
  list:   ()       => api.get('/warehouses/zones/'),
  create: (data)   => api.post('/warehouses/zones/', data),
  update: (id, d)  => api.put(`/warehouses/zones/${id}/`, d),
  delete: (id)     => api.delete(`/warehouses/zones/${id}/`),
};

// ── Racks ────────────────────────────────────────────────────
const Racks = {
  list:   ()       => api.get('/warehouses/racks/'),
  create: (data)   => api.post('/warehouses/racks/', data),
  update: (id, d)  => api.put(`/warehouses/racks/${id}/`, d),
  delete: (id)     => api.delete(`/warehouses/racks/${id}/`),
};

// ── Shelves ──────────────────────────────────────────────────
const Shelves = {
  list:   ()       => api.get('/warehouses/shelves/'),
  create: (data)   => api.post('/warehouses/shelves/', data),
  update: (id, d)  => api.put(`/warehouses/shelves/${id}/`, d),
  delete: (id)     => api.delete(`/warehouses/shelves/${id}/`),
};

// ── Reports ──────────────────────────────────────────────────
const Reports = {
  list:   ()       => api.get('/reports/'),
  create: (data)   => api.post('/reports/', data),
};

// ── Notifications ────────────────────────────────────────────
const Notifications = {
  list:   ()       => api.get('/notifications/'),
  markRead: (id)   => api.patch(`/notifications/${id}/`, { is_read: true }),
  markAllRead: ()  => api.post('/notifications/mark-all-read/'),
};

// ── Users ────────────────────────────────────────────────────
const Users = {
  list:   ()       => api.get('/users/'),
  update: (id, d)  => api.put(`/users/${id}/`, d),
  delete: (id)     => api.delete(`/users/${id}/`),
};

// ── Analytics ────────────────────────────────────────────────
const Analytics = {
  velocity:        () => api.get('/inventory/product-velocity/'),
  abc:             () => api.get('/inventory/abc-classification/'),
  forecastSummary: () => api.get('/inventory/demand-forecast/summary/'),
  forecast:        () => api.get('/inventory/demand-forecast/'),
};

// ── Approvals ────────────────────────────────────────────────
const Approvals = {
  transfers:          ()        => api.get('/inventory/transfer-requests/'),
  approveTransfer:    (id)      => api.patch(`/inventory/transfer-requests/${id}/`, { status: 'APPROVED' }),
  rejectTransfer:     (id)      => api.patch(`/inventory/transfer-requests/${id}/`, { status: 'REJECTED' }),
  adjustments:        ()        => api.get('/inventory/adjustment-requests/'),
  approveAdjustment:  (id)      => api.patch(`/inventory/adjustment-requests/${id}/`, { status: 'APPROVED' }),
  rejectAdjustment:   (id)      => api.patch(`/inventory/adjustment-requests/${id}/`, { status: 'REJECTED' }),
};