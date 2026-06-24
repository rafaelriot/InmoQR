'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, FileSpreadsheet, FileText, Edit, Trash2, ExternalLink, ShieldAlert, LogOut, Home, CheckCircle, XCircle } from 'lucide-react';

export default function SellerDashboard() {
  const [properties, setProperties] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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
                            p.estado === 'venta' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
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
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-all"
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

    </div>
  );
}
