import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminLogin({ setAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Conectando...');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://verde-mostaza-backend.onrender.com/api';
      const res = await axios.post(`${apiUrl}/login`, { email, password });
      
      if (res.data.role !== 'admin') {
        setMessage('No tienes permisos de administrador.');
        return;
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isAdmin', 'true');
      setAdmin(true);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-900">
      <div className="w-full max-w-sm bg-stone-800 p-8 rounded-3xl shadow-2xl border border-stone-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-stone-700 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SÚPER ADMIN</h1>
          <p className="text-sm text-stone-400 mt-1">Acceso exclusivo global</p>
        </div>
        
        {message && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg mb-4 text-sm">{message}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Correo de Admin" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <button type="submit" className="w-full bg-white text-stone-900 font-bold py-3.5 rounded-xl text-sm mt-2">Entrar al Sistema</button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-stone-400 hover:text-white font-bold">← Volver a la App</Link>
        </div>
      </div>
    </div>
  );
}
