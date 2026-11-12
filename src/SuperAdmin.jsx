import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdmin({ onLogout }) {
  const [data, setData] = useState({ kpis: { users: 0, orders: 0, sales: 0 }, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://verde-mostaza-backend.onrender.com/api';
        const res = await axios.get(`${apiUrl}/superadmin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Validación para asegurar que los datos existen antes de guardarlos
        if (res.data && res.data.kpis && res.data.users) {
          setData(res.data);
        } else {
          setError("Datos inválidos recibidos del servidor.");
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error de conexión o de permisos. Revisa la consola.");
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handlePromote = async (id) => {
    if(!window.confirm("¿Seguro que quieres hacer Admin a este usuario?")) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://verde-mostaza-backend.onrender.com/api';
      await axios.put(`${apiUrl}/superadmin/promote/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload(); // Recarga para ver el cambio
    } catch (err) { alert('Error al ascender'); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 text-red-300 p-6 rounded-2xl border border-red-700 text-center">
          <h2 className="text-xl font-bold mb-2">Ups, algo salió mal</h2>
          <p className="text-sm">{error}</p>
          <button onClick={onLogout} className="mt-4 bg-white text-stone-900 px-4 py-2 rounded-lg font-bold">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-100 min-h-screen p-3 md:p-8 font-sans pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg"><i className="fa-solid fa-shield-halved"></i></div>
            <div>
              <h1 className="font-black text-sm md:text-lg text-stone-900 tracking-tight">VERDE MOSTAZA</h1>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Super Admin Global</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-stone-400 hover:text-rose-600 text-xs md:text-sm font-bold flex items-center gap-1"><i className="fa-solid fa-right-from-bracket"></i> Salir</button>
        </header>

        {loading ? (
          <div className="text-center py-20 text-stone-500 font-bold">Cargando métricas globales...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <p className="text-[10px] uppercase font-bold text-stone-400">Usuarios Registrados</p>
                <h3 className="text-2xl font-black text-stone-900 mt-1">{data.kpis.users}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <p className="text-[10px] uppercase font-bold text-stone-400">Pedidos Globales</p>
                <h3 className="text-2xl font-black text-stone-900 mt-1">{data.kpis.orders}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <p className="text-[10px] uppercase font-bold text-stone-400">Ventas Totales Globales</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">${data.kpis.sales.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200">
                <h2 className="font-bold text-stone-800">Directorio de Tiendas y Roles</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-stone-50 text-stone-400 text-[10px] uppercase tracking-wider">
                      <th className="p-3 font-bold">Negocio</th>
                      <th className="p-3 font-bold">Correo</th>
                      <th className="p-3 font-bold">Rol</th>
                      <th className="p-3 font-bold">Ventas</th>
                      <th className="p-3 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {data.users.map(u => (
                      <tr key={u.id} className="hover:bg-stone-50 transition">
                        <td className="p-3 font-bold text-stone-900">{u.business_name}</td>
                        <td className="p-3 text-stone-500">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'}`}>
                            {u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-amber-600">${Number(u.total_sales || 0).toLocaleString()}</td>
                        <td className="p-3">
                          {u.role !== 'admin' && (
                            <button onClick={() => handlePromote(u.id)} className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-stone-700">Hacer Admin</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
