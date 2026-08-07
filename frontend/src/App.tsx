import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import ReservationStatus from './pages/ReservationStatus';
import ReservationManagement from './pages/ReservationManagement';

const SITE_NAME = 'TurkeyPOS 火雞肉飯';

const PAGE_TITLES: Record<string, string> = {
  '/': '點餐系統',
  '/kitchen': '廚房接單',
  '/reserve': '線上預定訂餐',
  '/reserve/status': '訂單查詢',
  '/login': '管理員登入',
  '/store-login': '分店登入',
  '/admin': '管理後台',
  '/admin/products': '商品管理',
  '/admin/stores': '分店管理',
  '/admin/sales': '銷售報表',
  '/admin/reservations': '預定訂單',
};

/** 依路由更新瀏覽器分頁標題 */
const DocumentTitle: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = PAGE_TITLES[pathname];
    document.title = page ? `${page} | ${SITE_NAME}` : SITE_NAME;
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <DocumentTitle />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/store-login" element={<StoreLogin />} />
        {/* 顧客線上預定 (免登入) */}
        <Route path="/reserve" element={<Reservation />} />
        {/* 顧客訂單查詢：/reserve/status?id=<訂單編號> */}
        <Route path="/reserve/status" element={<ReservationStatus />} />

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