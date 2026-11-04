#!/bin/bash
echo "Creando archivos de React..."
cd ~/verde-mostaza-react

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { brand: { 50: '#fef8e7', 100: '#fcefc8', 600: '#d4a017', 700: '#a87f0f', 900: '#3f2f05' } }, fontFamily: { sans: ['Inter', 'sans-serif'] } } },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOF

cat > src/index.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
body { font-family: 'Inter', sans-serif; background-color: #f5f5f4; color: #292524; }
EOF

cat > src/App.jsx << 'EOF'
import { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Cargando...');
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:3000/api/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.business_name);
        setMessage('Login exitoso');
      } else {
        await axios.post('http://localhost:3000/api/register', { email, password, business_name: businessName, business_slug: businessName.toLowerCase().replace(/ /g, '-') });
        setMessage('Usuario creado. Ahora puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error de conexión con el servidor');
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-stone-200">
          <h1 className="text-2xl font-black mb-2 text-brand-600">¡Bienvenido!</h1>
          <p className="text-stone-600 mb-6">Negocio: {user}</p>
          <button onClick={() => { localStorage.removeItem('token'); setUser(null); }} className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-bold text-sm w-full transition">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-brand-600/30">🌱</div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">VERDE MOSTAZA</h1>
          <p className="text-sm text-stone-500 mt-1">{isLogin ? 'Inicia sesión en tu tienda' : 'Crea tu cuenta de vendedor'}</p>
        </div>
        {message && <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.includes('exitoso') || message.includes('creado') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Nombre del Negocio</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition" placeholder="Ej: Perros de Juan" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition" placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition" placeholder="Mínimo 8 caracteres" />
          </div>
          <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition mt-2">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-brand-600 font-bold hover:underline">{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button>
        </div>
      </div>
    </div>
  );
}
EOF

echo "Instalando dependencias faltantes..."
npm install axios > /dev/null 2>&1

echo "Iniciando el Backend en segundo plano..."
cd ~/verde-mostaza-backend && node server.js &

echo "Iniciando el Frontend en React..."
cd ~/verde-mostaza-react && npm run dev
