'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, MapPin, Sparkles, Building, Landmark, Image as ImageIcon, Store, X } from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR errors
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function NewProperty() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipo, setTipo] = useState('casa');
  const [estado, setEstado] = useState('venta');
  const [ubicacion, setUbicacion] = useState('');
  const [coords, setCoords] = useState([19.5428, -96.9272]); // Jalapa Centro defaults
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [disponible, setDisponible] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/seller/login');
    }
  }, [router]);

  const handleMapChange = (newCoords) => {
    setCoords(newCoords);
  };

  const addFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    
    // Create FormData
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('tipo', tipo);
    formData.append('estado', estado);
    formData.append('ubicacion', ubicacion);
    formData.append('latitud', coords[0]);
    formData.append('longitud', coords[1]);
    formData.append('disponible', disponible);
    
    images.forEach(img => {
      formData.append('imagenes', img);
    });

    try {
      const res = await fetch('http://127.0.0.1:5000/api/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al publicar la propiedad');
      }

      router.push('/seller/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden p-6 sm:p-8">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={24} />
            <span>Publicar Nueva Propiedad</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Completa el formulario para ingresar la propiedad al catálogo y generar su ficha de código QR.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Título del Anuncio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Hermosa casa residencial con alberca"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tipo de Propiedad</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipo('casa')}
                      className={`flex-grow py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        tipo === 'casa'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <Building size={14} />
                      <span>Casa / Depto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo('terreno')}
                      className={`flex-grow py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        tipo === 'terreno'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <Landmark size={14} />
                      <span>Terreno</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo('local')}
                      className={`flex-grow py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        tipo === 'local'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <Store size={14} />
                      <span>Local</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Estado</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEstado('venta')}
                      className={`flex-grow py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        estado === 'venta'
                          ? 'bg-red-50 border-red-200 text-red-650'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      Venta
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstado('renta')}
                      className={`flex-grow py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        estado === 'renta'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-650'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      Renta
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Precio Solicitado (MXN)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 1500000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ubicación (Texto Descriptivo)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Colonia Las Ánimas, Jalapa, Veracruz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Disponibilidad Inicial</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={disponible}
                  onChange={(e) => setDisponible(parseInt(e.target.value))}
                >
                  <option value="1">Disponible</option>
                  <option value="0">{estado === 'venta' ? 'Vendido' : 'Rentado'}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Descripción de la Propiedad</label>
              <textarea
                required
                rows={9}
                placeholder="Detalla las características de la propiedad (habitaciones, baños, servicios, ventajas)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-[calc(100%-1.75rem)]"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          {/* Map Location Coordinates Picker */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <MapPin size={16} className="text-red-500" />
              Seleccionar Coordenadas en Mapa
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Haz clic en el mapa o arrastra el marcador para fijar la ubicación GPS exacta de la propiedad.</p>
            
            <div className="h-72 rounded-xl overflow-hidden border border-slate-200">
              <Map
                center={coords}
                zoom={13}
                onChange={handleMapChange}
                readOnly={false}
              />
            </div>
            
            <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-500">
              <div>Latitud: <span className="text-slate-800 font-mono">{coords[0].toFixed(6)}</span></div>
              <div>Longitud: <span className="text-slate-800 font-mono">{coords[1].toFixed(6)}</span></div>
            </div>
          </div>

          {/* Multiple File Upload via Drag & Drop */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <ImageIcon size={16} className="text-blue-500" />
              Subir Fotos de la Propiedad
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Arrastra y suelta imágenes o haz clic para seleccionar archivos. Límite de 5MB por archivo.</p>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-100/50 bg-white'
              }`}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className={`p-3.5 rounded-full transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-450 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                <ImageIcon size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Arrastra y suelta tus fotos aquí</p>
                <p className="text-[10px] text-slate-400 mt-0.5">o haz clic para explorar tus archivos</p>
              </div>
            </div>

            {/* Preview Thumbnails */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Fotos seleccionadas ({images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={url}
                        alt={`Preview ${idx}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute top-1 right-1 bg-red-550/90 hover:bg-red-600 text-white p-1 rounded-lg transition-colors shadow-sm"
                        title="Eliminar foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/seller/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Publicando...' : 'Publicar Propiedad'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
