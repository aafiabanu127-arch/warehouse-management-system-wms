# 🏭 Warehouse Management System (WMS)

> **An enterprise-grade, full-stack Warehouse Management System** with AI-powered demand forecasting, space optimization algorithms, ABC inventory classification, and real-time analytics — built with Django REST Framework and vanilla HTML/CSS/JavaScript.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Core Features](#-core-features)
- [Analytics & AI Engine](#-analytics--ai-engine)
- [Data Models](#-data-models)
- [API Endpoints](#-api-endpoints)
- [User Roles & Permissions](#-user-roles--permissions)
- [Frontend Pages](#-frontend-pages)
- [Quick Start — Local Development](#-quick-start--local-development)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Branching Strategy](#-branching-strategy)

---

## 🔍 Project Overview

The Warehouse Management System addresses three critical operational inefficiencies faced by modern logistics teams:

| Problem | Solution |
|---|---|
| Inefficient storage utilization | AI-powered **Best-Fit / First-Fit** shelf allocation engine |
| Misplaced or hard-to-locate inventory | Hierarchical location tracking: Warehouse → Zone → Rack → Shelf |
| Unpredictable demand causing stockouts | **NumPy linear regression** demand forecasting with MAE/RMSE/R² evaluation |

The system provides a centralized digital platform with role-based access control, a real-time analytics dashboard, automated low-stock alerts, and multi-format report exports (CSV, Excel, PDF).

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | UI pages, DOM manipulation, API integration |
| **Backend** | Django 6, Django REST Framework 3.17 | REST API, business logic, ORM |
| **Database** | PostgreSQL | Persistent data storage |
| **Authentication** | JWT via SimpleJWT | Stateless, role-aware token auth |
| **AI / Analytics** | NumPy 2.4 | Linear regression forecasting, model evaluation |
| **Export** | openpyxl, ReportLab, csv | Excel (.xlsx), PDF, and CSV report generation |
| **Performance Testing** | Locust 2.44 | Load testing up to 50 concurrent users |
| **API Documentation** | drf-spectacular (OpenAPI 3.0) | Auto-generated schema at `/api/schema/` |
| **Deployment** | Render.com | Backend (Web Service) + Frontend (Static Site) |
| **Static Files** | WhiteNoise | Zero-extra-infrastructure static file serving |
| **Database URL** | dj-database-url | 12-factor app config for PostgreSQL on Render |

> **Note on Frontend Migration:** The frontend was originally prototyped in React (TypeScript + Vite, found in `my-project/`). The production frontend has been rewritten in **pure HTML, CSS, and JavaScript** (`frontend/`) for zero build-step deployment and maximum browser compatibility.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Static)                    │
│  HTML pages  ──  CSS themes  ──  Vanilla JS modules     │
│  (dashboard, analytics, inventory, reports, etc.)       │
└───────────────────────┬─────────────────────────────────┘
                        │  REST API  (JWT Bearer Token)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              DJANGO REST FRAMEWORK BACKEND               │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │inventory │  │warehouses│  │  users   │  │reports │ │
│  │forecasting│  │  zones   │  │  roles   │  │exports │ │
│  │optimization│  │  racks   │  │  audit   │  │ PDF/XLS│ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ┌───────────────┐   ┌──────────────────────────────┐  │
│  │notifications  │   │  AI Engine (NumPy)            │  │
│  │  alerts       │   │  forecasting.py + optimization│  │
│  └───────────────┘   └──────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │  ORM (psycopg2)
                        ▼
              ┌──────────────────┐
              │   PostgreSQL DB  │
              └──────────────────┘
```

---

## 📁 Project Structure

```
warehouse-management-system/
│
├── backend/                          # Django REST API
│   ├── inventory/                    # Core inventory domain
│   │   ├── models.py                 # Product, Category, Inventory, StockMovement
│   │   ├── views.py                  # CRUD + approval + optimization endpoints
│   │   ├── forecasting.py            # AI demand forecasting (NumPy linear regression)
│   │   ├── optimization.py           # Best-Fit, First-Fit, ABC classification
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── management/commands/
│   │       ├── check_low_stock.py    # Automated low-stock notification trigger
│   │       └── run_forecasting.py    # Scheduled forecast regeneration
│   │
│   ├── warehouses/                   # Warehouse → Zone → Rack → Shelf hierarchy
│   ├── users/                        # Custom user model, roles, audit logging
│   ├── reports/                      # Report generation & multi-format export
│   ├── notifications/                # In-app alerts and notification feed
│   ├── applications/                 # Job applications module
│   ├── careers/                      # Careers/jobs listing module
│   ├── myproject2/                   # Django project settings & URL routing
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── exceptions.py
│   ├── manage.py
│   ├── locustfile.py                 # Locust load testing scenarios
│   └── er_diagram.html               # Interactive ER diagram
│
├── frontend/                         # Production frontend (HTML/CSS/JS)
│   ├── pages/                        # One HTML file per application screen
│   │   ├── landing.html              # Public marketing & login entry
│   │   ├── dashboard.html            # Main KPI dashboard
│   │   ├── analytics.html            # ABC, Velocity, Forecasting, Utilization tabs
│   │   ├── inventory.html
│   │   ├── products.html
│   │   ├── categories.html
│   │   ├── warehouses.html
│   │   ├── zones.html
│   │   ├── racks.html
│   │   ├── shelves.html
│   │   ├── stock-movements.html
│   │   ├── approvals.html
│   │   ├── reports.html
│   │   ├── notifications.html
│   │   ├── users.html
│   │   ├── stats.html
│   │   ├── careers.html
│   │   ├── services.html
│   │   ├── about.html
│   │   ├── login.html
│   │   └── register.html
│   │
│   ├── js/                           # Vanilla JS — one module per page
│   │   ├── api.js                    # Shared fetch wrapper with JWT auto-refresh
│   │   ├── analytics.js              # ABC, velocity, forecast, utilization tabs
│   │   ├── dashboard.js              # KPI stats, charts, low-stock feed
│   │   ├── inventory.js
│   │   ├── products.js
│   │   ├── warehouses.js
│   │   ├── zones.js / racks.js / shelves.js
│   │   ├── stock-movements.js
│   │   ├── approvals.js
│   │   ├── reports.js
│   │   ├── notifications.js
│   │   ├── users.js
│   │   ├── categories.js
│   │   ├── landing.js
│   │   └── theme.js                  # Dark/light mode toggle
│   │
│   └── css/                          # Modular stylesheets
│       ├── style.css                 # Global base styles
│       ├── theme.css                 # Dark/light theme variables
│       ├── dashboard.css
│       ├── analytics.css
│       └── [page-specific CSS files]
│
├── my-project/                       # Legacy React prototype (archived)
│   └── src/                          # React + TypeScript + Vite source
│
├── requirements.txt                  # Python dependencies (pinned versions)
├── .env.example                      # Environment variable template
├── README.md                         # This file
├── DEPLOYMENT_GUIDE.md               # Step-by-step Render.com deployment
├── TEST_REPORT.md                    # 26 test cases across 6 test categories
├── WMS_Project_Report.docx
├── WMS_User_Manual.docx
├── WMS_Presentation.pptx
└── ASSIGNMENTS_DAY1-5.zip
```

---

## ⚡ Core Features

### Inventory Management
- Full CRUD for **Products**, **Categories**, and **Inventory** records
- SKU-based product identification with duplicate validation
- Configurable **reorder levels** per product with automated alert triggers
- Unit volume, unit weight, and unit price tracking per product

### Warehouse Hierarchy
- Multi-level location model: **Warehouse → Zone → Rack → Shelf**
- Per-shelf capacity tracking (`capacity`, `occupied_capacity`)
- Manager assignment per warehouse with role-based access enforcement

### Stock Movements
- Three movement types: **IN**, **OUT**, **TRANSFER**
- Timestamped, auditable movement log
- Inventory quantity auto-recalculated on each movement
- Outbound validation — prevents stock-out beyond available quantity

### Approval Workflows
- **Stock Transfer Requests** — staff requests cross-shelf/cross-warehouse moves; managers approve or reject
- **Inventory Adjustment Requests** — staff submits ADD / REMOVE / CORRECT adjustments; manager reviews
- Full audit trail: `requested_by`, `reviewed_by`, `reviewed_at`, `reason`

### Notifications & Alerts
- Automated low-stock notifications triggered via Django management commands
- In-app notification feed with read/unread state
- Alert system for threshold breaches

### Reports & Exports
- On-demand report generation for inventory snapshots, stock movements, and warehouse utilization
- Export to **CSV**, **Excel (.xlsx via openpyxl)**, and **PDF (via ReportLab)** — all from the same endpoint
- Date-range filtering on all report types

---

## 📊 Analytics & AI Engine

The analytics module is the system's most technically sophisticated component. It lives in `backend/inventory/forecasting.py` and `backend/inventory/optimization.py`.

### 1. AI Demand Forecasting

**File:** `backend/inventory/forecasting.py`

The forecasting engine uses **NumPy linear regression** trained on weekly stock-out (demand) data to predict future demand per product.

**How it works:**

```
Weekly OUT movements (12 weeks history)
         │
         ▼
  Linear Regression  (NumPy polyfit, degree=1)
  y = mx + b
         │
         ▼
  4-week ahead predictions
         │
         ▼
  Model Evaluation (70/30 train/test split)
  ├── MAE   (Mean Absolute Error)
  ├── RMSE  (Root Mean Squared Error)
  └── R²    (Coefficient of Determination)
         │
         ▼
  Accuracy Label: Excellent (R²≥0.85) / Good / Fair / Poor
```

**Model Comparison — Linear Regression vs Moving Average:**

The engine runs both models on held-out test data and auto-selects the one with lower MAE. This justifies Linear Regression as the primary model in cases where trend is present.

| Metric | Linear Regression | Moving Average |
|---|---|---|
| Captures trend | ✅ Yes | ❌ No |
| Works with < 4 weeks data | ❌ | ✅ (partial) |
| Selected when | Trend is present | Data is stationary |

**API Endpoint:** `GET /api/inventory/forecasting/?product_id={id}`

**Sample response:**
```json
{
  "product_name": "Widget A",
  "sku": "WGT-001",
  "average_weekly_demand": 42.5,
  "trend": "increasing",
  "model_evaluation": {
    "mae": 3.12,
    "rmse": 4.08,
    "r_squared": 0.87,
    "model_accuracy": "Excellent"
  },
  "forecast_next_weeks": [
    {"week": 1, "predicted_quantity": 48.0},
    {"week": 2, "predicted_quantity": 51.5},
    {"week": 3, "predicted_quantity": 55.0},
    {"week": 4, "predicted_quantity": 58.5}
  ],
  "reorder_recommendation": "Reorder soon - demand is rising."
}
```

**Scheduled automation:**
```bash
python manage.py run_forecasting   # regenerate all forecasts
python manage.py check_low_stock   # check thresholds & fire alerts
```

---

### 2. Space Optimization Engine

**File:** `backend/inventory/optimization.py`

Two classical bin-packing algorithms are implemented for intelligent shelf allocation:

| Algorithm | Strategy | Best Used When |
|---|---|---|
| **Best-Fit** | Picks the shelf with the least remaining space after placement | Minimizing fragmentation |
| **First-Fit** | Picks the first shelf with sufficient free capacity | Speed over optimality |

Both algorithms filter by `warehouse_id` when provided and return a rich response including projected utilization percentage.

**API Endpoint:** `POST /api/inventory/recommend-shelf/`
```json
{
  "required_volume": 5.0,
  "warehouse_id": 1,
  "strategy": "BEST_FIT"
}
```

---

### 3. ABC Inventory Classification

**File:** `backend/inventory/optimization.py` → `get_abc_classification()`

Classifies all products by their cumulative outbound movement volume, following the Pareto principle:

| Class | Cumulative Volume Share | Velocity | Storage Recommendation |
|---|---|---|---|
| **A** | 0–70% | High (fast movers) | Store near dispatch — minimize pick time |
| **B** | 70–90% | Moderate | Standard shelf location |
| **C** | 90–100% | Low (slow movers) | Remote or overflow shelves |

Products with zero movement are automatically assigned Class C.

**API Endpoint:** `GET /api/inventory/abc-classification/`

---

### 4. Product Velocity Analysis

Ranks all products by total outbound quantity over all time. Provides `total_outbound_quantity` and `movement_count` per product — used as the input data source for ABC classification and reorder prioritization.

**API Endpoint:** `GET /api/inventory/product-velocity/`

---

### 5. Warehouse Utilization Summary

Computes overall and per-shelf utilization percentages across one or all warehouses:

```
Utilization % = (occupied_capacity / total_capacity) × 100
```

**API Endpoint:** `GET /api/warehouses/kpi/`  
**Filterable by:** `?warehouse_id={id}`

---

## 🗃 Data Models

```
Warehouse
├── Zone (FK → Warehouse)
│   └── Rack (FK → Zone)
│       └── Shelf (FK → Rack)  ← occupied_capacity tracked here

Category
└── Product (FK → Category)
    ├── unit_volume, unit_weight, unit_price
    └── reorder_level

Inventory (Product × Shelf → quantity)
├── StockMovement (Product, qty, IN/OUT/TRANSFER)
├── SpaceAllocation (Product, Shelf → allocated_volume, utilization_%)
├── StockTransferRequest (from_inventory → to_inventory, PENDING/APPROVED/REJECTED)
└── InventoryAdjustmentRequest (ADD/REMOVE/CORRECT, PENDING/APPROVED/REJECTED)

CustomUser
├── role (Admin/Manager/Supervisor/Staff/Picker/Auditor/Viewer)
└── managed_warehouses (M2M via Warehouse.manager)

Notification / Alert
Report (title, type, result JSONField, generated_at)
```

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api/`. Authentication via `Authorization: Bearer <access_token>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/token/` | Obtain JWT access + refresh tokens |
| `POST` | `/token/refresh/` | Refresh access token |
| `GET/POST` | `/inventory/products/` | List / create products |
| `GET/POST` | `/inventory/inventory/` | List / create inventory records |
| `GET/POST` | `/inventory/stock-movements/` | List / create stock movements |
| `GET` | `/inventory/forecasting/` | AI demand forecast (all or by product) |
| `GET` | `/inventory/abc-classification/` | ABC product classification |
| `GET` | `/inventory/product-velocity/` | Product velocity ranking |
| `POST` | `/inventory/recommend-shelf/` | Shelf allocation recommendation |
| `GET/POST` | `/inventory/transfer-requests/` | Stock transfer workflows |
| `GET/POST` | `/inventory/adjustment-requests/` | Inventory adjustment workflows |
| `GET` | `/warehouses/warehouses/` | List warehouses |
| `GET` | `/warehouses/kpi/` | KPI + utilization summary |
| `GET` | `/warehouses/zones/` | List zones |
| `GET` | `/warehouses/racks/` | List racks |
| `GET` | `/warehouses/shelves/` | List shelves |
| `GET/POST` | `/reports/reports/` | Generate and list reports |
| `GET` | `/reports/reports/{id}/export/?format=csv` | Export report (csv/xlsx/pdf) |
| `GET` | `/notifications/notifications/` | List in-app notifications |
| `GET` | `/notifications/alerts/` | List alert records |
| `GET` | `/schema/` | OpenAPI 3.0 schema (drf-spectacular) |

Full schema available at `/api/schema/` — importable into Postman or viewable with Swagger UI.

---

## 👥 User Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full system access — users, settings, all CRUD |
| **Manager** | Approve/reject transfer & adjustment requests; view analytics |
| **Supervisor** | Manage inventory, products, and movements |
| **Staff** | Submit transfer and adjustment requests |
| **Picker** | View inventory locations; record outbound stock movements |
| **Auditor** | Read-only access to inventory, movements, and reports |
| **Viewer** | Dashboard and report viewing only |

Role enforcement is applied at the Django view layer via permission classes. Unauthorized role access returns `403 Forbidden`.

---

## 🖥 Frontend Pages

The frontend is a **multi-page HTML application** with one `.html` file, one `.js` module, and one `.css` file per screen. All pages share `api.js` for authenticated API calls with automatic JWT token refresh.

| Page | File | Description |
|---|---|---|
| Landing | `landing.html` | Public home page with feature overview |
| Login | `login.html` | JWT authentication form |
| Register | `register.html` | New user registration |
| Dashboard | `dashboard.html` | KPI stats, charts, low-stock feed, recent movements |
| Analytics | `analytics.html` | Tabbed: ABC Classification / Velocity / Forecasting / Utilization |
| Inventory | `inventory.html` | Inventory records by product + shelf |
| Products | `products.html` | Product catalog CRUD |
| Categories | `categories.html` | Category management |
| Warehouses | `warehouses.html` | Warehouse management |
| Zones | `zones.html` | Zone management per warehouse |
| Racks | `racks.html` | Rack management per zone |
| Shelves | `shelves.html` | Shelf capacity tracking |
| Stock Movements | `stock-movements.html` | Log of all IN/OUT/TRANSFER events |
| Approvals | `approvals.html` | Transfer & adjustment request approval queue |
| Reports | `reports.html` | Generate & export reports |
| Notifications | `notifications.html` | In-app alert feed |
| Users | `users.html` | User management (Admin only) |
| Stats | `stats.html` | Extended statistics view |
| About / Services / Careers | — | Public information pages |

**Theme:** A light/dark mode toggle is available on all pages via `theme.js` and `theme.css`.  
**Auth Guard:** Every protected page checks `localStorage.getItem('access')` on load and redirects to `login.html` if missing.

---

## 🚀 Quick Start — Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL (or use SQLite for development — leave `DATABASE_URL` blank)
- A modern web browser (no build step required for frontend)

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/warehouse-management-system.git
cd warehouse-management-system

# 2. Set up Python environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp ../.env.example .env
# Edit .env — set SECRET_KEY; leave DATABASE_URL blank for SQLite

# 5. Apply migrations and create admin user
python manage.py migrate
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
# API available at http://localhost:8000/api/
# Admin panel at http://localhost:8000/admin/
```

### Frontend Setup

No build step required — open HTML files directly in a browser or serve with any static file server:

```bash
# From the project root
cd frontend

# Option A — Python simple server
python -m http.server 5173

# Option B — VS Code Live Server extension (recommended)
# Open frontend/ in VS Code → click "Go Live"
```

The frontend calls `http://127.0.0.1:8000/api` by default (configured in `frontend/js/api.js` as `BASE_URL`). Update this constant for any other environment.

### Run Automated Management Commands

```bash
# Check for low stock and create notifications
python manage.py check_low_stock

# Regenerate demand forecasts for all products
python manage.py run_forecasting
```

### Run Load Tests (Locust)

```bash
cd backend
locust -f locustfile.py --host=http://localhost:8000
# Open http://localhost:8089 to launch the Locust UI
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` in the project root and fill in the values:

```env
# Django
SECRET_KEY=your-secret-key-here        # 50+ random characters
DEBUG=True                              # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
# Leave blank to use SQLite in development
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Frontend origin (for CORS and password reset emails)
FRONTEND_URL=http://localhost:5173

# Email (optional — for SMTP in production)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your@email.com
# EMAIL_HOST_PASSWORD=your-password
```

> **Security:** Never commit `.env` to version control. It is listed in `.gitignore`.

---

## 🧪 Testing

**26 test cases across 6 categories — all passing.**

| Category | Tests | Passed | Tools |
|---|---|---|---|
| Unit Tests | 8 | 8 | Django `TestCase` (pytest) |
| Integration Tests | 4 | 4 | Django `TestCase` + DRF `APIClient` |
| Validation Tests | 4 | 4 | DRF serializer validation |
| Security Tests | 4 | 4 | JWT enforcement, RBAC, SQL injection |
| UI Tests | 3 | 3 | Manual browser testing |
| Performance Tests | 3 | 3 | Locust (50 concurrent users) |
| **Total** | **26** | **26** | |

**Performance benchmarks (Locust — 50 concurrent users):**

| Endpoint | Concurrent Users | Avg Response |
|---|---|---|
| `GET /api/inventory/` | 50 | < 200ms ✅ |
| `POST /api/stock-movements/` | 20 | < 300ms ✅ |
| `GET /api/reports/` | 10 | < 400ms ✅ |

Run the full test suite:

```bash
cd backend
pytest
# or
python manage.py test
```

See `TEST_REPORT.md` for the full test case breakdown with expected results.

---

## ☁️ Deployment

The system is deployed on **Render.com** using three separate services:

| Service | Type | Purpose |
|---|---|---|
| `warehouse-db` | PostgreSQL (Managed) | Production database |
| `warehouse-backend` | Web Service (Python) | Django API — gunicorn WSGI |
| `warehouse-frontend` | Static Site | HTML/CSS/JS served as static files |

**Backend start command:**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
gunicorn myproject2.wsgi:application
```

**Required production environment variables** (set in Render dashboard):

| Key | Value |
|---|---|
| `SECRET_KEY` | Any 50-char random string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `warehouse-backend.onrender.com` |
| `DATABASE_URL` | Internal DB URL from Render PostgreSQL |
| `FRONTEND_URL` | `https://warehouse-frontend.onrender.com` |

Full step-by-step instructions in `DEPLOYMENT_GUIDE.md`.

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after a cold start may take ~30 seconds to respond.

---

## 🌿 Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready, deployed code |
| `dev` | Integration branch — features merged here for testing |
| `feature/inventory-management` | Active feature development |

All feature branches are created from `dev` and merged back via pull requests.

---

## 📄 License

This project is developed as part of an academic/internship assignment. All rights reserved by the author.

---

*Built with Django REST Framework + HTML/CSS/JS · AI forecasting powered by NumPy · Deployed on Render.com*