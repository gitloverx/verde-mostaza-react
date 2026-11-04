import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
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
      {/* RUTA PÚBLICA: Usuarios */}
      <Route path="/" element={
        user ? <Dashboard businessName={user} onLogout={handleLogout} /> : <UserLogin setUser={setUser} />
      } />

      {/* RUTA OCULTA: Admin Login */}
      <Route path="/admin" element={
        admin ? <Navigate to="/admin/panel" /> : <AdminLogin setAdmin={setAdmin} />
      } />

      {/* RUTA PROTEGIDA: Panel de Admin */}
      <Route path="/admin/panel" element={
        admin ? <SuperAdmin onLogout={handleLogout} /> : <Navigate to="/admin" />
      } />
    </Routes>
  );
}
