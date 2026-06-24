'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, MapPin, Sparkles, Building, Landmark, Image as ImageIcon, Trash, Store, X } from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR errors
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function EditProperty({ params: paramsPromise }) {
  const params = use(paramsPromise); // Unwrap params in Next 15
  const { id } = params;

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipo, setTipo] = useState('casa');
  const [estado, setEstado] = useState('venta');
  const [ubicacion, setUbicacion] = useState('');
  const [coords, setCoords] = useState([19.5428, -96.9272]);
  const [disponible, setDisponible] = useState(1);
  
  // Images already uploaded
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  // New images to upload
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/seller/login');
      return;
    }

    const fetchPropertyDetails = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/properties/${id}`);
        if (!res.ok) throw new Error('Error al obtener los detalles de la propiedad');
        const data = await res.json();
        
        setTitulo(data.titulo);
        setDescripcion(data.descripcion);
        setPrecio(data.precio);
        setTipo(data.tipo);
        setEstado(data.estado);
        setUbicacion(data.ubicacion);
        setCoords([parseFloat(data.latitud), parseFloat(data.longitud)]);
        setExistingImages(data.imagenes || []);
        setDisponible(data.disponible !== undefined ? data.disponible : 1);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id, router]);

  const handleMapChange = (newCoords) => {
    setCoords(newCoords);
  };

  const addNewFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    setNewImages(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      addNewFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      addNewFiles(e.target.files);
    }
  };

  const toggleDeleteImage = (imgId) => {
    if (imagesToDelete.includes(imgId)) {
      setImagesToDelete(imagesToDelete.filter(i => i !== imgId));
    } else {
      setImagesToDelete([...imagesToDelete, imgId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
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
    
    // Append images to delete
    imagesToDelete.forEach(imgId => {
      formData.append('imagenesAEliminar', imgId);
    });

    // Append new files
    newImages.forEach(img => {
      formData.append('imagenes', img);
    });

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar la propiedad');
      }

      router.push('/seller/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Cargando datos de propiedad...</p>
      </div>
    );
  }

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
            <span>Editar Propiedad</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Realiza modificaciones a tu anuncio inmobiliario y actualiza las imágenes o coordenadas.</p>
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Disponibilidad</label>
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
              Actualizar Coordenadas en Mapa
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Haz clic en el mapa o arrastra el marcador para cambiar la ubicación GPS exacta de la propiedad.</p>
            
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

          {/* Manage Existing Images */}
          {existingImages.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Imágenes Actuales</h3>
              <p className="text-[11px] text-slate-400 mb-3">Marca las imágenes que deseas eliminar permanentemente de esta propiedad.</p>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {existingImages.map((img) => {
                  const isMarked = imagesToDelete.includes(img.id);
                  return (
                    <div
                      key={img.id}
                      onClick={() => toggleDeleteImage(img.id)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        isMarked ? 'border-red-650 opacity-40' : 'border-slate-200'
                      }`}
                    >
                      <img src={`http://127.0.0.1:5000${img.url}`} alt="" className="object-cover w-full h-full" />
                      {isMarked && (
                        <div className="absolute inset-0 bg-red-650/10 flex items-center justify-center text-white">
                          <Trash size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload More Images via Drag & Drop */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <ImageIcon size={16} className="text-blue-500" />
              Subir Nuevas Fotos
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Arrastra y suelta imágenes o haz clic para seleccionar archivos adicionales.</p>
            
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
              <div className={`p-3.5 rounded-full transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-455 group-hover:bg-blue-50 group-hover:text-blue-505'}`}>
                <ImageIcon size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Arrastra y suelta tus fotos aquí</p>
                <p className="text-[10px] text-slate-400 mt-0.5">o haz clic para explorar tus archivos</p>
              </div>
            </div>

            {/* Preview Thumbnails */}
            {newImagePreviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Nuevas fotos seleccionadas ({newImages.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newImagePreviews.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={url}
                        alt={`New Preview ${idx}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNewImage(idx);
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

          {/* Save / Cancel */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/seller/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
