import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Admin from './pages/Admin';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<POS />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
};

export default App;