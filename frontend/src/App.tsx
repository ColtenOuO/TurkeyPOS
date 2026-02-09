import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';
import ProductManagement from './pages/ProductManagement';
import SalesDashboard from './pages/SalesDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<POS />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/sales" element={<SalesDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;