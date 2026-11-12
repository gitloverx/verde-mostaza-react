import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ businessName, onLogout }) {
  const [tab, setTab] = useState('caja');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('');
  const [stats, setStats] = useState({ total_sales: 0, total_orders: 0, top_products: [] });
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Estados Modales
  const [showProdModal, setShowProdModal] = useState(false);
  const [showIngModal, setShowIngModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false); // Nuevo estado para el selector visual
  
  // Formularios
  const [prodData, setProdData] = useState({ id: null, name: '', description: '', price: 10000, icon: 'fa-solid fa-hotdog', recipe: [] });
  const [ingData, setIngData] = useState({ id: null, name: '', stock: 0, unit: 'und' });

  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://verde-mostaza-backend.onrender.com/api', headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tab]);

  const loadData = async () => {
    try {
      const [resP, resI, resO, resS] = await Promise.all([
        api.get('/products'), api.get('/inventory'), api.get('/orders'), api.get('/stats')
      ]);
      setProducts(resP.data); setInventory(resI.data); setOrders(resO.data); setStats(resS.data);
    } catch (err) { console.error(err); }
  };

  // --- Lógica Caja ---
  const addToCart = (p) => {
    const ex = cart.find(c => c.id === p.id);
    if (ex) setCart(cart.map(c => c.id === p.id ? {...c, qty: c.qty + 1} : c));
    else setCart([...cart, { ...p, qty: 1 }]);
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(c => c.id === id ? (c.qty + delta > 0 ? { ...c, qty: c.qty + delta } : null) : c).filter(Boolean));
  };

  const submitOrder = async () => {
    if (!cart.length) return;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await api.post('/orders', { customer_name: customer, items: cart, total });
      setCart([]); setCustomer(''); loadData();
    } catch (err) { console.error(err); }
  };

  // --- Lógica Inventario ---
  const openIngModal = (ing = null) => {
    if (ing) setIngData({ id: ing.id, name: ing.name, stock: ing.stock, unit: ing.unit });
    else setIngData({ id: null, name: '', stock: 0, unit: 'und' });
    setShowIngModal(true);
  };

  const saveIngredient = async () => {
    try {
      if (ingData.id) {
        await api.put(`/inventory/${ingData.id}`, { stock: ingData.stock });
      } else {
        await api.post('/inventory', ingData);
      }
      setShowIngModal(false); loadData();
    } catch (err) { alert('Error al guardar ingrediente'); }
  };

  // --- Lógica Productos (Recetas) ---
  const openProdModal = (prod = null) => {
    if (prod) setProdData({ ...prod, recipe: prod.recipe || [] });
    else setProdData({ id: null, name: '', description: '', price: 10000, icon: 'fa-solid fa-hotdog', recipe: [] });
    setShowProdModal(true);
  };

  const addRecipeItem = (ing) => {
    if (prodData.recipe.find(r => r.ingredient_id === ing.id)) return;
    setProdData({ ...prodData, recipe: [...prodData.recipe, { ingredient_id: ing.id, name: ing.name, unit: ing.unit, qty: 1 }] });
  };

  const updateRecipeQty = (ingId, val) => {
    const q = parseInt(val) || 0;
    if (q <= 0) setProdData({ ...prodData, recipe: prodData.recipe.filter(r => r.ingredient_id !== ingId) });
    else setProdData({ ...prodData, recipe: prodData.recipe.map(r => r.ingredient_id === ingId ? { ...r, qty: q } : r) });
  };

  const saveProduct = async () => {
    try {
      const payload = {
        name: prodData.name.trim().toUpperCase(),
        description: prodData.description.trim(),
        price: parseInt(prodData.price),
        icon: prodData.icon,
        recipe: prodData.recipe
      };
      if (prodData.id) await api.put(`/products/${prodData.id}`, payload);
      else await api.post('/products', payload);
      setShowProdModal(false); loadData();
    } catch (err) { alert('Error al guardar producto'); }
  };

  const deleteProduct = async () => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try { await api.delete(`/products/${prodData.id}`); setShowProdModal(false); loadData(); } catch (err) {}
  };

  // --- Lógica Cocina ---
  const updateOrderStatus = async (id, status) => {
    try { await api.put(`/orders/${id}`, { status }); loadData(); } catch (err) {}
  };

  const formatElapsed = (timestamp) => {
    const ms = currentTime - new Date(timestamp).getTime();
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60), s = totalSec % 60;
    if (m >= 60) return `${Math.floor(m/60)}h ${m%60}m`;
    return `${m}m ${String(s).padStart(2,'0')}s`;
  };

  const timerColor = (timestamp) => {
    const min = (currentTime - new Date(timestamp).getTime()) / 60000;
    if (min < 5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (min < 10) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (min < 15) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse';
  };

  // Lista completa de íconos disponibles para todos los usuarios
  const iconsList = [
    'fa-solid fa-hotdog', 'fa-solid fa-burger', 'fa-solid fa-pizza-slice', 'fa-solid fa-fire',
    'fa-solid fa-wheat-awn', 'fa-solid fa-drumstick-bite', 'fa-solid fa-fish', 'fa-solid fa-cow',
    'fa-solid fa-egg', 'fa-solid fa-cheese', 'fa-solid fa-bread-slice', 'fa-solid fa-bowl-food',
    'fa-solid fa-utensils', 'fa-solid fa-pepper-hot', 'fa-solid fa-carrot', 'fa-solid fa-apple-whole',
    'fa-solid fa-lemon', 'fa-solid fa-ice-cream', 'fa-solid fa-cookie', 'fa-solid fa-cake-candles',
    'fa-solid fa-candy-cane', 'fa-solid fa-mug-hot', 'fa-solid fa-glass-water', 'fa-solid fa-bottle-water',
    'fa-solid fa-beer-mug-empty', 'fa-solid fa-wine-glass', 'fa-solid fa-martini-glass', 'fa-solid fa-box',
    'fa-solid fa-bag-shopping', 'fa-solid fa-plus', 'fa-solid fa-seedling', 'fa-solid fa-star'
  ];

  return (
    <div className="bg-stone-100 min-h-screen flex flex-col font-sans select-none pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm"><i className="fa-solid fa-seedling"></i></div>
          <div>
            <h1 className="font-black text-xs tracking-tight text-stone-900 leading-none uppercase truncate max-w-[150px]">{businessName}</h1>
            <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">{tab === 'caja' ? 'Caja' : tab === 'cocina' ? 'Cocina' : tab}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
          <button onClick={onLogout} className="text-stone-400 hover:text-rose-600 p-1 text-xs"><i className="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-3 space-y-4">
        {/* CAJA */}
        {tab === 'caja' && (
          <>
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-stone-200 flex gap-2 items-center">
              <i className="fa-solid fa-user text-stone-400 pl-2 text-xs"></i>
              <input value={customer} onChange={e => setCustomer(e.target.value)} type="text" placeholder="Nombre del cliente..." className="w-full bg-transparent text-sm focus:outline-none font-medium placeholder:text-stone-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Menu Rapido</span>
                <span className="text-[10px] text-amber-600 font-semibold">{products.length} productos</span>
              </div>
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-2xl border border-stone-200 active:scale-[0.99] transition flex items-center justify-between cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-sm"><i className={p.icon || "fa-solid fa-hotdog"}></i></div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{p.name}</h4>
                        <p className="text-[11px] text-stone-400">{p.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-amber-600">${p.price?.toLocaleString()}</span>
                      <div className="text-[10px] text-stone-400 font-medium">+ Agregar</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mt-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-3">
                <span className="font-bold text-sm text-stone-900 flex items-center gap-2 uppercase tracking-wide"><i className="fa-solid fa-receipt text-amber-600"></i> Pedido Actual</span>
                <button onClick={() => setCart([])} className="text-xs text-stone-400 hover:text-rose-600">Vaciar</button>
              </div>
              {cart.length === 0 ? <p className="text-stone-400 text-xs py-2 text-center">Sin items en el pedido</p> : cart.map(it => (
                <div key={it.id} className="flex justify-between items-center py-1.5 border-b border-stone-50">
                  <span className="font-semibold text-sm text-stone-800">{it.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(it.id, -1)} className="w-6 h-6 bg-stone-100 rounded text-sm font-bold">-</button>
                    <span className="text-sm font-bold w-5 text-center">{it.qty}</span>
                    <button onClick={() => updateCartQty(it.id, 1)} className="w-6 h-6 bg-stone-100 rounded text-sm font-bold">+</button>
                  </div>
                </div>
              ))}
              <div className="border-t border-stone-100 pt-3 flex justify-between items-center mt-3">
                <span className="text-xs text-stone-500 uppercase font-bold">Total:</span>
                <span className="text-amber-600 font-black text-xl">${cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}</span>
              </div>
              <button onClick={submitOrder} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl text-sm shadow-md mt-3 flex items-center justify-center gap-2"><i className="fa-solid fa-check"></i> Enviar a Cocina</button>
            </div>
          </>
        )}

        {/* COCINA */}
        {tab === 'cocina' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cocina en Vivo</span>
              <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold">{orders.filter(o => o.status !== 'listo').length} pendientes</span>
            </div>
            {orders.filter(o => o.status !== 'listo').map(o => (
              <div key={o.id} className={`bg-white p-4 rounded-2xl border-2 ${(currentTime - new Date(o.created_at).getTime())/60000 >= 15 ? 'border-rose-300' : 'border-stone-200'} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-stone-900">#{o.id} - {o.customer_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${timerColor(o.created_at)}`}>{formatElapsed(o.created_at)}</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl text-sm space-y-1">
                  {o.items?.length > 0 ? o.items.map((i, idx) => <div key={idx} className="font-medium text-stone-800">- {i.qty}x {i.name}</div>) : <div className="text-stone-400 text-xs">Cargando...</div>}
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-stone-400">{new Date(o.created_at).toLocaleTimeString()}</span>
                  <div className="flex gap-2">
                    {o.status === 'pendiente' && <button onClick={() => updateOrderStatus(o.id, 'preparacion')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Cocinar</button>}
                    {o.status === 'preparacion' && <button onClick={() => updateOrderStatus(o.id, 'listo')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Listo</button>}
                  </div>
                </div>
              </div>
            ))}
            {orders.filter(o => o.status !== 'listo').length === 0 && <p className="text-center text-stone-400 py-10">No hay pedidos en cocina</p>}
          </div>
        )}

        {/* INVENTARIO */}
        {tab === 'inventario' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Inventario</span>
              <button onClick={() => openIngModal()} className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl"><i className="fa-solid fa-plus"></i> Nuevo ingrediente</button>
            </div>
            {inventory.map(i => (
              <div key={i.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center"><i className="fa-solid fa-box text-stone-700 text-sm"></i></div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">{i.name}</h4>
                      <p className="text-[11px] text-stone-400">Stock: <span className="font-bold text-stone-700">{i.stock} {i.unit}</span></p>
                    </div>
                  </div>
                  <button onClick={() => openIngModal(i)} className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg text-xs"><i className="fa-solid fa-pen"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADMIN */}
        {tab === 'admin' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400">Ventas Totales</span>
                <h3 className="text-xl font-black text-stone-900 mt-1">${Number(stats.total_sales).toLocaleString()}</h3>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400">Total Pedidos</span>
                <h3 className="text-xl font-black text-stone-900 mt-1">{stats.total_orders}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Estadísticas de Ventas</span>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1"><i className="fa-solid fa-arrow-trend-up"></i> Más vendidos</p>
                {stats.top_products?.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex justify-between bg-emerald-50 p-2 rounded-lg text-xs border border-emerald-100 mb-1">
                    <span className="font-semibold text-emerald-800">{i+1}. {p.product_name}</span>
                    <span className="font-bold text-emerald-700">{p.total_qty} und</span>
                  </div>
                ))}
                {stats.top_products?.length === 0 && <p className="text-xs text-stone-400">Sin ventas aún.</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1"><i className="fa-solid fa-arrow-trend-down"></i> Menos vendidos</p>
                {stats.top_products?.slice(-2).reverse().map((p, i) => (
                  <div key={i} className="flex justify-between bg-rose-50 p-2 rounded-lg text-xs border border-rose-100 mb-1">
                    <span className="font-semibold text-rose-800">{i+1}. {p.product_name}</span>
                    <span className="font-bold text-rose-700">{p.total_qty} und</span>
                  </div>
                ))}
                {stats.top_products?.length === 0 && <p className="text-xs text-stone-400">Sin ventas aún.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Productos</span>
                <button onClick={() => openProdModal()} className="bg-stone-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"><i className="fa-solid fa-plus"></i> Nuevo producto</button>
              </div>
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} className="bg-stone-50 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center text-xs"><i className={p.icon || "fa-solid fa-hotdog"}></i></div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{p.name}</h4>
                        <p className="text-[10px] text-stone-400">{p.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600 text-xs">${p.price?.toLocaleString()}</span>
                      <button onClick={() => openProdModal(p)} className="bg-stone-200 px-2 py-1 rounded-lg text-[10px]"><i className="fa-solid fa-pen"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL INGREDIENTE */}
      {showIngModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">{ingData.id ? 'Editar' : 'Nuevo'} Ingrediente</h3>
              <button onClick={() => setShowIngModal(false)}><i className="fa-solid fa-xmark text-stone-400"></i></button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nombre</label>
              <input value={ingData.name} onChange={e => setIngData({...ingData, name: e.target.value})} disabled={!!ingData.id} placeholder="Ej: Chorizo" className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Stock</label>
                <input type="number" value={ingData.stock} onChange={e => setIngData({...ingData, stock: e.target.value})} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Unidad</label>
                <select value={ingData.unit} onChange={e => setIngData({...ingData, unit: e.target.value})} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none">
                  <option value="und">unidades</option><option value="porc">porciones</option><option value="kg">kg</option><option value="L">L</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowIngModal(false)} className="flex-1 bg-stone-100 font-bold py-2.5 rounded-xl text-xs">Cancelar</button>
              <button onClick={saveIngredient} className="flex-1 bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO CON RECETA */}
      {showProdModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-3 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md shadow-xl space-y-3 border border-stone-100">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-sm">{prodData.id ? 'Editar' : 'Nuevo'} Producto</h3>
              <button onClick={() => setShowProdModal(false)} className="text-stone-400 hover:text-rose-600 p-1 text-sm"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nombre</label>
              <input value={prodData.name} onChange={e => setProdData({...prodData, name: e.target.value})} placeholder="Ej: ESPECIAL" className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold uppercase focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Descripción</label>
              <input value={prodData.description} onChange={e => setProdData({...prodData, description: e.target.value})} placeholder="Ej: Chorizo con queso" className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Precio</label>
                <input type="number" value={prodData.price} onChange={e => setProdData({...prodData, price: e.target.value})} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Icono</label>
                <button type="button" onClick={() => setShowIconPicker(true)} className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-between focus:outline-none">
                  <i className={`${prodData.icon} text-lg text-amber-600`}></i>
                  <i className="fa-solid fa-chevron-down text-xs text-stone-400"></i>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Receta (Ingredientes)</label>
              <div className="bg-stone-50 rounded-xl p-2 border border-stone-100 max-h-48 overflow-y-auto space-y-1.5 mt-1">
                {prodData.recipe?.map(r => (
                  <div key={r.ingredient_id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-200 mb-1 shadow-sm">
                    <span className="text-xs font-semibold text-stone-900 truncate">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={r.qty} onChange={e => updateRecipeQty(r.ingredient_id, e.target.value)} className="w-16 text-center text-sm font-bold bg-stone-50 border border-stone-200 rounded-lg py-1 focus:outline-none" />
                      <span className="text-[10px] text-stone-400 w-6">{r.unit}</span>
                    </div>
                  </div>
                ))}
                
                {prodData.recipe?.length === 0 && <p className="text-stone-400 text-xs py-2 text-center">No hay ingredientes en la receta.</p>}
                
                <div className="mt-2 border-t border-stone-200 pt-2">
                  <select onChange={e => { const ing = inventory.find(i => i.id == e.target.value); if(ing) addRecipeItem(ing); e.target.value=""; }} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-bold text-stone-700">
                    <option value="">+ Añadir ingrediente a la receta...</option>
                    {inventory.filter(i => !prodData.recipe?.find(r => r.ingredient_id === i.id)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {prodData.id && <button onClick={deleteProduct} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs"><i className="fa-solid fa-trash"></i></button>}
              <button onClick={() => setShowProdModal(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs">Cancelar</button>
              <button onClick={saveProduct} className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR VISUAL DE ICONOS (El que reemplaza al menú feo de Android) */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-sm">Selecciona el ícono</h3>
              <button onClick={() => setShowIconPicker(false)}><i className="fa-solid fa-xmark text-stone-400"></i></button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto p-1">
              {iconsList.map(icon => (
                <button key={icon} onClick={() => { setProdData({...prodData, icon}); setShowIconPicker(false); }}
                  className={`p-3 rounded-xl border flex items-center justify-center text-xl transition ${prodData.icon === icon ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
                  <i className={icon}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-3 flex justify-around items-center z-40 max-w-md mx-auto">
        {['caja', 'cocina', 'inventario', 'admin'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex flex-col items-center gap-1 ${tab === t ? 'text-amber-600' : 'text-stone-400'}`}>
            <i className={`fa-solid ${t === 'caja' ? 'fa-cash-register' : t === 'cocina' ? 'fa-fire-burner' : t === 'inventario' ? 'fa-boxes-stacked' : 'fa-chart-pie'} text-lg`}></i>
            <span className="text-[10px] font-bold capitalize">{t === 'caja' ? 'Caja' : t === 'cocina' ? 'Cocina' : t === 'inventario' ? 'Inventario' : 'Admin'}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
