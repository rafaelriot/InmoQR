'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, FileSpreadsheet, FileText, Edit, Trash2, ExternalLink, ShieldAlert, LogOut, Home, CheckCircle, XCircle, Users, UserPlus, X } from 'lucide-react';

export default function SellerDashboard() {
  const [properties, setProperties] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Admin user management state
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [usersLoading, setUsersLoading] = useState(false);

  // User form modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); 
  const [userNombre, setUserNombre] = useState('');
  const [userTelefono, setUserTelefono] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRol, setUserRol] = useState('vendedor');
  const [userModalError, setUserModalError] = useState('');

  const fetchUsers = async () => {
    setUsersLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al obtener lista de usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar para obtener los asesores.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleOpenCreateUserModal = () => {
    setEditingUser(null);
    setUserNombre('');
    setUserTelefono('');
    setUserEmail('');
    setUserPassword('');
    setUserRol('vendedor');
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u) => {
    setEditingUser(u);
    setUserNombre(u.nombre);
    setUserTelefono(u.telefono);
    setUserEmail(u.email);
    setUserPassword('');
    setUserRol(u.rol);
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserModalError('');
    const token = localStorage.getItem('token');

    const payload = {
      nombre: userNombre,
      telefono: userTelefono,
      email: userEmail,
      rol: userRol,
      activo: editingUser ? editingUser.activo : 1
    };

    if (userPassword) {
      payload.password = userPassword;
    } else if (!editingUser) {
      setUserModalError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      let res;
      if (editingUser) {
        res = await fetch(`http://127.0.0.1:5000/api/auth/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://127.0.0.1:5000/api/auth/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar el usuario');

      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      setUserModalError(err.message);
    }
  };

  const handleToggleUserActive = async (user) => {
    if (user.id === seller?.id) {
      alert('No puedes deshabilitar tu propia cuenta.');
      return;
    }

    const token = localStorage.getItem('token');
    const newActivo = user.activo === 1 ? 0 : 1;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/auth/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: user.nombre,
          telefono: user.telefono,
          email: user.email,
          rol: user.rol,
          activo: newActivo
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar estado del usuario');

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, activo: newActivo } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchSellerProperties = async (sellerId, token, rol) => {
    try {
      const url = rol === 'admin'
        ? `http://127.0.0.1:5000/api/properties`
        : `http://127.0.0.1:5000/api/properties?vendedor_id=${sellerId}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al obtener propiedades del asesor');
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
      setError('Error de comunicación con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const sellerDataStr = localStorage.getItem('vendedor');

    if (!token || !sellerDataStr) {
      router.push('/seller/login');
      return;
    }

    try {
      const sellerObj = JSON.parse(sellerDataStr);
      setSeller(sellerObj);
      fetchSellerProperties(sellerObj.id, token, sellerObj.rol);
      if (sellerObj.rol === 'admin') {
        fetchUsers();
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('vendedor');
      router.push('/seller/login');
    }
  }, [router]);

  const handleDelete = async (propertyId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar la propiedad');
      }

      // Filter deleted property out of the state
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = async (propertyId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/properties/${propertyId}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar la disponibilidad');
      
      // Update local state to trigger instant UI refresh (metrics and table update)
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, disponible: data.disponible } : p));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendedor');
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Panel de Control</span>
          <h1 className="text-2xl font-black text-slate-800 mt-0.5">Bienvenido, {seller?.nombre}</h1>
          <p className="text-xs text-slate-400 mt-1">{seller?.email} | Tel: {seller?.telefono}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/seller/properties/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow"
          >
            <PlusCircle size={15} />
            <span>Publicar Propiedad</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <LogOut size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher for Admin */}
      {seller?.rol === 'admin' && (
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-450 hover:text-slate-600'
            }`}
          >
            Gestión de Propiedades
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-450 hover:text-slate-600'
            }`}
          >
            Gestión de Asesores
          </button>
        </div>
      )}

      {/* Tab Content: Properties Management */}
      {activeTab === 'properties' && (
        <>
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Publicaciones</span>
                <span className="text-3xl font-black text-slate-800 mt-1 block">{properties.length}</span>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                <Home size={24} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Disponibles</span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">
                  {properties.filter(p => p.disponible === 1).length}
                </span>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Vendidos / Rentados</span>
                <span className="text-3xl font-black text-rose-600 mt-1 block">
                  {properties.filter(p => p.disponible === 0).length}
                </span>
              </div>
              <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl">
                <XCircle size={24} />
              </div>
            </div>
          </div>

          {/* Reports and Global exports */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm">
            <div>
              <h3 className="font-bold text-sm">Reportes Globales de Catálogo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Genera y descarga listados completos de propiedades de la inmobiliaria en formato PDF o Excel.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href="http://127.0.0.1:5000/api/reports/properties/export/excel"
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar Excel</span>
              </a>
              <a
                href="http://127.0.0.1:5000/api/reports/properties/export/pdf"
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                <FileText size={15} />
                <span>Exportar PDF</span>
              </a>
            </div>
          </div>

          {/* Database connection errors */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2 text-sm">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Properties Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800 text-base">Historial de Propiedades Publicadas</h2>
              <span className="bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-full">
                {properties.length} en total
              </span>
            </div>

            {properties.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No has publicado ninguna propiedad todavía. Utiliza el botón superior para crear tu primer anuncio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                      <th className="px-6 py-4">Imagen</th>
                      <th className="px-6 py-4">Título</th>
                      {seller?.rol === 'admin' && <th className="px-6 py-4">Asesor</th>}
                      <th className="px-6 py-4">Tipo / Operación</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Ubicación</th>
                      <th className="px-6 py-4">Publicado</th>
                      <th className="px-6 py-4">Disponibilidad</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {properties.map((p) => {
                      const mainImage = p.imagenes && p.imagenes.length > 0
                        ? `http://127.0.0.1:5000${p.imagenes[0].url}`
                        : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              <img
                                src={mainImage}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {p.titulo}
                          </td>
                          {seller?.rol === 'admin' && (
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                              {p.vendedor_nombre || 'Desconocido'}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 uppercase">
                                {p.tipo === 'casa' ? 'Casa' : p.tipo === 'terreno' ? 'Terreno' : 'Local'}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                                p.estado === 'venta' ? 'bg-red-50 text-red-650' : 'bg-emerald-50 text-emerald-650'
                              }`}>
                                {p.estado}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-600">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p.precio)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[150px]">
                            {p.ubicacion}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                            {new Date(p.created_at).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleAvailability(p.id)}
                              title="Haz clic para cambiar disponibilidad"
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                p.disponible === 1 
                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100' 
                                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {p.disponible === 1 
                                ? 'Disponible' 
                                : p.estado === 'venta' ? 'Vendido' : 'Rentado'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`http://127.0.0.1:5000/api/reports/properties/${p.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Ver Ficha PDF con QR"
                              >
                                <FileText size={16} />
                              </a>
                              <Link
                                href={`/properties/${p.id}`}
                                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                                title="Ver en Portal Público"
                              >
                                <ExternalLink size={16} />
                              </Link>
                              <Link
                                href={`/seller/properties/edit/${p.id}`}
                                className="p-2 text-slate-400 hover:text-amber-650 hover:bg-slate-100 rounded-lg transition-all"
                                title="Editar Datos"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Eliminar Propiedad"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab Content: Users Management */}
      {activeTab === 'users' && seller?.rol === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200 rounded-2xl p-5 shadow-sm gap-4">
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">Gestión de Asesores e Inmobiliarios</h2>
              <p className="text-xs text-slate-400 mt-1">Crea, edita, cambia roles o inhabilita el acceso al panel.</p>
            </div>
            <button
              onClick={handleOpenCreateUserModal}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow shrink-0"
            >
              <UserPlus size={15} />
              <span>Agregar Asesor</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2 text-sm">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {usersLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Cargando asesores registrados...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No hay asesores registrados en la plataforma.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Teléfono</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4">Acceso</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">#{u.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{u.nombre}</span> 
                          {u.id === seller?.id && (
                            <span className="text-[9px] bg-blue-50 text-blue-650 px-2 py-0.5 rounded font-normal shrink-0">Tú</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.email}</td>
                        <td className="px-6 py-4 text-slate-500">{u.telefono}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${u.rol === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            disabled={u.id === seller?.id}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              u.activo === 1
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 border-red-200 text-red-750 hover:bg-red-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={u.id === seller?.id ? "No puedes deshabilitar tu propia cuenta" : "Cambiar estado de acceso"}
                          >
                            {u.activo === 1 ? 'Activo' : 'Deshabilitado'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Editar Datos"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {isUserModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl relative border border-slate-100 animate-page-fade"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all duration-200"
              title="Cerrar"
            >
              <X size={18} />
            </button>

            <h3 className="font-black text-slate-800 text-lg mb-1">
              {editingUser ? 'Editar Datos del Asesor' : 'Agregar Nuevo Asesor'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {editingUser ? 'Edita los datos del usuario seleccionado.' : 'Ingresa los datos para registrar un nuevo asesor en la plataforma.'}
            </p>

            {userModalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">
                {userModalError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userNombre}
                  onChange={(e) => setUserNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 2281234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userTelefono}
                  onChange={(e) => setUserTelefono(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. juan@inmoqr.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Contraseña {editingUser && <span className="text-slate-400 font-normal">(Dejar en blanco para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? "••••••••" : "Ingresa contraseña"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol del Usuario</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userRol}
                  onChange={(e) => setUserRol(e.target.value)}
                >
                  <option value="vendedor">Vendedor (Acceso limitado a sus publicaciones)</option>
                  <option value="admin">Administrador (Control total del sistema)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
