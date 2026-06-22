import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Warehouses from './pages/Warehouses';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import StockMovements from './pages/StockMovements';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import UserManagement from './pages/UserManagement';
import Zones from './pages/Zones';
import Racks from './pages/Racks';
import Shelves from './pages/Shelves';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
          </Route>

          <Route
            path="/warehouses"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Warehouses />} />
          </Route>

          <Route
            path="/categories"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Categories />} />
          </Route>

          <Route
            path="/products"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Products />} />
          </Route>

          <Route
            path="/inventory"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Inventory />} />
          </Route>

          <Route
            path="/stock-movements"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<StockMovements />} />
          </Route>

          <Route
            path="/analytics"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Analytics />} />
          </Route>

          <Route
            path="/approvals"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Approvals />} />
          </Route>

          <Route
            path="/notifications"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Notifications />} />
          </Route>

          <Route
            path="/users"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<UserManagement />} />
          </Route>

          <Route
            path="/zones"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Zones />} />
          </Route>

          <Route
            path="/racks"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Racks />} />
          </Route>

          <Route
            path="/shelves"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<Shelves />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
