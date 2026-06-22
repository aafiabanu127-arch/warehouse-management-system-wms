# Test Report — Warehouse Management System

## 1. Unit Tests

| Test ID | Module | Test Case | Expected Result | Status |
|---------|--------|-----------|-----------------|--------|
| UT-01 | Inventory | Create product with valid SKU | Product saved to DB | PASS |
| UT-02 | Inventory | Create product with duplicate SKU | ValidationError raised | PASS |
| UT-03 | Users | Register user with valid data | User created with hashed password | PASS |
| UT-04 | Users | Login with wrong password | 401 Unauthorized returned | PASS |
| UT-05 | Warehouse | Create warehouse with capacity | Warehouse record saved | PASS |
| UT-06 | StockMovement | Record stock-in movement | Inventory quantity increases | PASS |
| UT-07 | StockMovement | Record stock-out beyond quantity | ValidationError raised | PASS |
| UT-08 | Notifications | Trigger low-stock alert | Notification record created | PASS |

## 2. Integration Tests

| Test ID | Module | Test Case | Expected Result | Status |
|---------|--------|-----------|-----------------|--------|
| IT-01 | Auth + Inventory | JWT token used to access /api/inventory/ | 200 OK with data | PASS |
| IT-02 | Transfer Request | Staff creates transfer, Manager approves | Status changes to APPROVED | PASS |
| IT-03 | Inventory + Shelf | Product assigned to shelf updates occupied_capacity | Capacity recalculated correctly | PASS |
| IT-04 | Reports | Generate stock movement report for date range | Filtered data returned | PASS |

## 3. Validation Tests

| Test ID | Field | Test Case | Expected Result | Status |
|---------|-------|-----------|-----------------|--------|
| VT-01 | Product SKU | Empty SKU submitted | 400 Bad Request | PASS |
| VT-02 | Quantity | Negative quantity submitted | ValidationError | PASS |
| VT-03 | User Role | Invalid role string submitted | 400 Bad Request | PASS |
| VT-04 | Email | Invalid email format | ValidationError | PASS |

## 4. Security Tests

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| ST-01 | Access /api/users/ without token | 401 Unauthorized | PASS |
| ST-02 | Staff role accesses admin-only endpoint | 403 Forbidden | PASS |
| ST-03 | SQL injection in search field | Sanitized, no DB error | PASS |
| ST-04 | Expired JWT token used | 401 Unauthorized | PASS |

## 5. UI Tests (Frontend)

| Test ID | Component | Test Case | Expected Result | Status |
|---------|-----------|-----------|-----------------|--------|
| UI-01 | ProductFormModal | Submit form with valid data | Modal closes, product added | PASS |
| UI-02 | CategoryFormModal | Submit empty form | Validation error shown | PASS |
| UI-03 | Login Page | Submit wrong credentials | Error message displayed | PASS |

## 6. Performance Tests (Locust)

| Test ID | Endpoint | Concurrent Users | Avg Response Time | Status |
|---------|----------|-----------------|-------------------|--------|
| PT-01 | GET /api/inventory/ | 50 | < 200ms | PASS |
| PT-02 | POST /api/stock-movements/ | 20 | < 300ms | PASS |
| PT-03 | GET /api/reports/ | 10 | < 400ms | PASS |

## Summary

| Test Type | Total | Passed | Failed |
|-----------|-------|--------|--------|
| Unit Tests | 8 | 8 | 0 |
| Integration Tests | 4 | 4 | 0 |
| Validation Tests | 4 | 4 | 0 |
| Security Tests | 4 | 4 | 0 |
| UI Tests | 3 | 3 | 0 |
| Performance Tests | 3 | 3 | 0 |
| **Total** | **26** | **26** | **0** |
