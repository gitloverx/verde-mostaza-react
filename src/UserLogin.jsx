import { useState } from 'react';
import axios from 'axios';

export default function UserLogin({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Cargando...');
    try {
      if (isLogin) {
        const res = await axios.post('import.meta.env.VITE_API_URL/login', { email, password });
        if (res.data.role === 'admin') {
            setMessage('Eres admin. Entra por la puerta de Admin.');
            return;
        }
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('businessName', res.data.business_name);
        setUser(res.data.business_name);
      } else {
        await axios.post('import.meta.env.VITE_API_URL/register', { email, password, business_name: businessName, business_slug: businessName.toLowerCase().replace(/ /g, '-') });
        setMessage('Usuario creado. Inicia sesión.');
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-stone-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <i className="fa-solid fa-seedling"></i>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">VERDE MOSTAZA</h1>
          <p className="text-sm text-stone-500 mt-1">{isLogin ? 'Inicia sesión en tu tienda' : 'Crea tu cuenta de vendedor'}</p>
        </div>
        {message && <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.includes('exitoso') || message.includes('creado') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Nombre del Negocio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />}
          <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <button type="submit" className="w-full bg-stone-900 text-white font-bold py-3.5 rounded-xl text-sm mt-2">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-amber-600 font-bold hover:underline">{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button>
        </div>
      </div>
    </div>
  );
}
