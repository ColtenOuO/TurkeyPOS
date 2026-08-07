import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';
import ProductManagement from './pages/ProductManagement';
import SalesDashboard from './pages/SalesDashboard';
import Login from './pages/Login';
import StoreManagement from './pages/StoreManagement';
import ProtectedRoute from './components/ProtectedRoute';
import StoreLogin from './pages/StoreLogin';
import StoreProtectedRoute from './components/StoreProtectedRoute';
import Reservation from './pages/Reservation';
import ReservationManagement from './pages/ReservationManagement';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/store-login" element={<StoreLogin />} />
        {/* 顧客線上預定 (免登入) */}
        <Route path="/reserve" element={<Reservation />} />

        {/* Store Protected Routes (POS & Kitchen) */}
        <Route element={<StoreProtectedRoute />}>
          <Route path="/" element={<POS />} />
          <Route path="/kitchen" element={<Kitchen />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/stores" element={<StoreManagement />} />
          <Route path="/admin/sales" element={<SalesDashboard />} />
          <Route path="/admin/reservations" element={<ReservationManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;