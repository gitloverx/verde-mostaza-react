import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import SuperAdmin from './SuperAdmin';
import UserLogin from './UserLogin';
import AdminLogin from './AdminLogin';

export default function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedName = localStorage.getItem('businessName');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (token && isAdmin) setAdmin(true);
    else if (token && savedName) setUser(savedName);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setAdmin(false);
  };

  return (
    <Routes>
      <Route path="/" element={ user ? <Dashboard businessName={user} onLogout={handleLogout} /> : <UserLogin setUser={setUser} /> } />
      <Route path="/admin" element={ admin ? <Navigate to="/admin/panel" /> : <AdminLogin setAdmin={setAdmin} /> } />
      <Route path="/admin/panel" element={ admin ? <SuperAdmin onLogout={handleLogout} /> : <Navigate to="/admin" /> } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
