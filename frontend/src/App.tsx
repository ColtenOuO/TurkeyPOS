import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';
import ProductManagement from './pages/ProductManagement';
import SalesDashboard from './pages/SalesDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<POS />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/sales" element={<SalesDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;