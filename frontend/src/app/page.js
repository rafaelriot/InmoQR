'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Search, MapPin, DollarSign, Filter, FileText, ArrowRight, Home as HomeIcon } from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR errors
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [buscar, setBuscar] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [disponible, setDisponible] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buscar) params.append('buscar', buscar);
      if (tipo) params.append('tipo', tipo);
      if (estado) params.append('estado', estado);
      if (precioMin) params.append('precioMin', precioMin);
      if (precioMax) params.append('precioMax', precioMax);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (disponible) params.append('disponible', disponible);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://127.0.0.1:5000/api/properties?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Error al obtener las propiedades');
      const data = await res.json();
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [tipo, estado, disponible]); // Fetch automatically on dropdown select change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleClearFilters = () => {
    setBuscar('');
    setTipo('');
    setEstado('');
    setPrecioMin('');
    setPrecioMax('');
    setFechaInicio('');
    setFechaFin('');
    setDisponible('');
    setTimeout(() => {
      // Small delay to ensure states are cleared
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(`http://127.0.0.1:5000/api/properties`, { headers })
        .then(res => res.json())
        .then(data => setProperties(data));
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white mb-10 shadow-lg">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Encuentra tu próximo hogar o terreno
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
          Explora casas, departamentos y terrenos en venta o renta. Accede a fichas técnicas con códigos QR listos para compartir.
        </p>

        {/* Quick Search Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row items-center gap-2 text-slate-800">
          <div className="flex items-center gap-2 px-3 w-full border-b md:border-b-0 md:border-r border-slate-200 py-2">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Buscar por título, descripción o ubicación..."
              className="w-full bg-transparent focus:outline-none text-sm"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all"
          >
            Buscar Propiedades
          </button>
        </form>
      </div>

      {/* Main Content Layout: Map + Grid + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Filter Form Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-base">
              <Filter size={18} className="text-blue-600" />
              Filtros de Búsqueda
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-blue-600 font-semibold"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tipo de Propiedad</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="casa">Casa / Departamento</option>
                <option value="terreno">Terreno</option>
                <option value="local">Local Comercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Estado</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="">Venta o Renta</option>
                <option value="venta">Venta</option>
                <option value="renta">Renta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Precio Mínimo (MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Precio Máximo (MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha Desde</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha Hasta</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            {isLoggedIn && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Disponibilidad</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={disponible}
                  onChange={(e) => setDisponible(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="1">Disponible</option>
                  <option value="0">Vendido / Rentado</option>
                </select>
              </div>
            )}

            <button
              onClick={fetchProperties}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-2.5 rounded-lg transition-all mt-6"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Right Side: Map & Cards Grid */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Map Viewer */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-1.5">
              <MapPin size={16} className="text-red-500" />
              Vista en Mapa Interactivo
            </h3>
            <div className="h-80 rounded-xl overflow-hidden">
              {!loading && properties.length > 0 ? (
                <Map
                  center={[properties[0].latitud, properties[0].longitud]}
                  zoom={12}
                  markers={properties}
                  readOnly={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-sm">
                  {loading ? 'Cargando coordenadas...' : 'Sin ubicaciones para mostrar'}
                </div>
              )}
            </div>
          </div>

          {/* Catalog Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-800">
              Propiedades Disponibles ({properties.length})
            </h2>
          </div>

          {/* Loading or Error States */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[380px]">
                  {/* Image Shimmer */}
                  <div className="w-full aspect-video skeleton-shimmer" />
                  {/* Content Shimmer */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="h-6 w-1/3 rounded-lg skeleton-shimmer" />
                      <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
                      <div className="h-3 w-1/2 rounded-lg skeleton-shimmer" />
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3 w-full rounded-lg skeleton-shimmer" />
                        <div className="h-3 w-5/6 rounded-lg skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
                      <div className="h-9 flex-grow rounded-lg skeleton-shimmer" />
                      <div className="h-9 w-24 rounded-lg skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
              <p className="font-semibold mb-2">{error}</p>
              <p className="text-xs text-red-500">¿Iniciaste el servidor backend en el puerto 5000?</p>
              <button
                onClick={fetchProperties}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Catalog Grid */}
          {!loading && !error && properties.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <HomeIcon className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="font-semibold mb-1">No se encontraron propiedades</p>
              <p className="text-xs">Prueba ajustando los filtros o realizando otra búsqueda.</p>
            </div>
          )}

          {!loading && !error && properties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => {
                const mainImage = p.imagenes && p.imagenes.length > 0
                  ? `http://127.0.0.1:5000${p.imagenes[0].url}`
                  : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Property Image Cover */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      {/* Status and Type Badges */}
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        {p.disponible === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm bg-slate-900/90 text-white">
                            {p.estado === 'venta' ? 'Vendido' : 'Rentado'}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm text-white ${
                            p.estado === 'venta' ? 'bg-red-500' : 'bg-emerald-500'
                          }`}>
                            En {p.estado}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm bg-slate-900/80 backdrop-blur-sm text-white">
                          {p.tipo === 'casa' ? 'Casa' : p.tipo === 'terreno' ? 'Terreno' : 'Local'}
                        </span>
                      </div>
                      <img
                        src={mainImage}
                        alt={p.titulo}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>

                    {/* Property Data */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="text-xl font-extrabold text-blue-600 mb-1 flex items-center">
                          <DollarSign size={18} className="shrink-0 -ml-1" />
                          <span>
                            {new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(p.precio)}
                          </span>
                          <span className="text-xs font-normal text-slate-400 ml-1">MXN</span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {p.titulo}
                        </h3>

                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1.5 mb-3">
                          <MapPin size={12} className="shrink-0 text-red-400" />
                          <span className="line-clamp-1">{p.ubicacion}</span>
                        </div>

                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                          {p.descripcion}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                        <Link
                          href={`/properties/${p.id}`}
                          className="flex-grow flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-lg transition-all"
                        >
                          <span>Ver Detalle</span>
                          <ArrowRight size={13} />
                        </Link>
                        <a
                          href={`http://127.0.0.1:5000/api/reports/properties/${p.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-all"
                          title="Descargar Ficha PDF con QR"
                        >
                          <FileText size={14} />
                          <span className="hidden sm:inline">Ficha PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
