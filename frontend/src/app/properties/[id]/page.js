'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, DollarSign, Phone, Mail, User, FileText, Calendar, Building, Landmark, Store, X, ChevronLeft, ChevronRight, Share2, QrCode, Check } from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR errors
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function PropertyDetail({ params: paramsPromise }) {
  const params = use(paramsPromise); // Unwrap params in Next 15
  const { id } = params;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: property?.titulo || 'InmoQR Propiedad',
      text: property?.descripcion ? (property.descripcion.slice(0, 100) + '...') : '',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    }
  };

  const handlePrevLightboxImage = () => {
    if (!property?.imagenes || property.imagenes.length === 0) return;
    setLightboxImageIdx((prev) => (prev === 0 ? property.imagenes.length - 1 : prev - 1));
  };

  const handleNextLightboxImage = () => {
    if (!property?.imagenes || property.imagenes.length === 0) return;
    setLightboxImageIdx((prev) => (prev === property.imagenes.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isLightboxOpen && !isQrModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setIsQrModalOpen(false);
      } else if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') {
          handlePrevLightboxImage();
        } else if (e.key === 'ArrowRight') {
          handleNextLightboxImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, lightboxImageIdx, isQrModalOpen, property]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/properties/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Propiedad no encontrada');
          throw new Error('Error al obtener la propiedad');
        }
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link Shimmer */}
        <div className="h-5 w-40 rounded-lg skeleton-shimmer mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns (Col Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Shimmer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="w-full aspect-video rounded-xl skeleton-shimmer" />
              <div className="flex gap-2">
                <div className="h-12 w-20 rounded-lg skeleton-shimmer" />
                <div className="h-12 w-20 rounded-lg skeleton-shimmer" />
                <div className="h-12 w-20 rounded-lg skeleton-shimmer" />
              </div>
            </div>

            {/* Description Shimmer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="h-6 w-1/4 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded-lg skeleton-shimmer" />
                <div className="h-4 w-full rounded-lg skeleton-shimmer" />
                <div className="h-4 w-5/6 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Price / PDF Shimmer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded-lg skeleton-shimmer" />
                <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
              </div>
              <div className="h-12 w-full rounded-xl skeleton-shimmer" />
            </div>

            {/* Seller Shimmer */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-md space-y-6">
              <div className="h-6 w-1/2 rounded-lg skeleton-shimmer opacity-40" />
              <div className="space-y-4">
                <div className="h-10 w-full rounded-xl skeleton-shimmer opacity-30" />
                <div className="h-10 w-full rounded-xl skeleton-shimmer opacity-30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-700 mb-2">¡Oops!</h2>
          <p className="text-sm text-red-600 mb-6">{error || 'No pudimos cargar la propiedad'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver al Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const mainImageUrl = property.imagenes && property.imagenes.length > 0
    ? `http://127.0.0.1:5000${property.imagenes[activeImageIdx].url}`
    : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver al listado completo</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Col Span 2): Image Gallery, Map and Description */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gallery View */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-4">
            <div 
              onClick={() => {
                if (property.imagenes && property.imagenes.length > 0) {
                  setLightboxImageIdx(activeImageIdx);
                  setIsLightboxOpen(true);
                }
              }}
              className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group"
            >
              <img
                src={mainImageUrl}
                alt={property.titulo}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-sm text-white ${
                  property.estado === 'venta' ? 'bg-red-500' : 'bg-emerald-500'
                }`}>
                  En {property.estado}
                </span>
                <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-sm bg-slate-900/80 backdrop-blur-sm text-white flex items-center gap-1.5">
                  {property.tipo === 'casa' ? <Building size={14} /> : property.tipo === 'terreno' ? <Landmark size={14} /> : <Store size={14} />}
                  <span>{property.tipo === 'casa' ? 'Casa / Depto' : property.tipo === 'terreno' ? 'Terreno' : 'Local Comercial'}</span>
                </span>
              </div>
            </div>

            {/* Thumbnail Carousel */}
            {property.imagenes && property.imagenes.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {property.imagenes.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx ? 'border-blue-600 scale-95' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={`http://127.0.0.1:5000${img.url}`}
                      alt=""
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Characteristics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Descripción Completa
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {property.descripcion}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Publicado</span>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-1">
                  <Calendar size={13} className="text-blue-500" />
                  {new Date(property.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</span>
                <span className="text-xs font-semibold text-slate-700 uppercase mt-1 block">
                  {property.tipo === 'casa' ? 'Casa / Depto' : property.tipo === 'terreno' ? 'Terreno' : 'Local Comercial'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Operación</span>
                <span className="text-xs font-semibold text-slate-700 uppercase mt-1 block">
                  {property.estado === 'venta' ? 'Venta Directa' : 'Renta Mensual'}
                </span>
              </div>
            </div>
          </div>

          {/* Leaflet Map Location */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <MapPin size={18} className="text-red-500" />
              Ubicación Geográfica
            </h2>
            <p className="text-xs text-slate-400 mb-4">{property.ubicacion}</p>
            <div className="h-96 rounded-xl overflow-hidden">
              <Map
                center={[parseFloat(property.latitud), parseFloat(property.longitud)]}
                zoom={14}
                markers={[property]}
                readOnly={true}
              />
            </div>
          </div>

        </div>

        {/* Right Column (Col Span 1): Price, Seller contact card and PDF download */}
        <div className="space-y-6">
          
          {/* Main Stats Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Precio Solicitado</span>
              <div className="text-3xl font-black text-slate-800 flex items-center mt-1">
                <DollarSign size={24} className="text-blue-600 -ml-1 shrink-0" />
                <span>
                  {new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(property.precio)}
                </span>
                <span className="text-sm font-normal text-slate-400 ml-1">MXN</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-1.5 text-slate-500 text-xs">
              <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
              <span>{property.ubicacion}</span>
            </div>

            <a
              href={`http://127.0.0.1:5000/api/reports/properties/${property.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <FileText size={18} />
              <span>Generar Ficha PDF + QR</span>
            </a>

            {/* Share and QR buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all border border-slate-200"
              >
                {copied ? <Check size={14} className="text-emerald-650" /> : <Share2 size={14} />}
                <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all border border-slate-200"
              >
                <QrCode size={14} />
                <span>Ver QR</span>
              </button>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md space-y-6">
            <h3 className="font-bold text-base flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <User size={16} className="text-blue-400" />
              Datos del Asesor
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Completo</span>
                <span className="text-sm font-semibold text-white mt-1 block">{property.vendedor_nombre}</span>
              </div>

              <a
                href={`tel:${property.vendedor_telefono}`}
                className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-colors w-full"
              >
                <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Llamar ahora</span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">{property.vendedor_telefono}</span>
                </div>
              </a>

              <a
                href={`mailto:${property.vendedor_email}`}
                className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-colors w-full"
              >
                <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Enviar correo</span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">{property.vendedor_email}</span>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && property.imagenes && property.imagenes.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/75 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 z-50"
            title="Cerrar (Esc)"
          >
            <X size={24} />
          </button>

          {/* Main Modal Area */}
          <div className="relative w-full max-w-5xl px-4 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
            {/* Prev Button */}
            {property.imagenes.length > 1 && (
              <button
                onClick={handlePrevLightboxImage}
                className="text-white/75 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-200 shrink-0"
                title="Anterior"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Image Container */}
            <div className="relative flex-1 aspect-video flex items-center justify-center max-h-[85vh]">
              <img
                src={`http://127.0.0.1:5000${property.imagenes[lightboxImageIdx].url}`}
                alt=""
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-300 transform scale-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Next Button */}
            {property.imagenes.length > 1 && (
              <button
                onClick={handleNextLightboxImage}
                className="text-white/75 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-200 shrink-0"
                title="Siguiente"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Indicator & Filmstrip */}
          <div className="absolute bottom-6 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-white/70 text-xs font-semibold tracking-wider">
              {lightboxImageIdx + 1} / {property.imagenes.length}
            </span>
            {property.imagenes.length > 1 && (
              <div className="flex gap-2 max-w-md overflow-x-auto px-4 py-1">
                {property.imagenes.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setLightboxImageIdx(idx)}
                    className={`relative w-12 aspect-video rounded overflow-hidden border-2 shrink-0 transition-all ${
                      lightboxImageIdx === idx ? 'border-blue-500 scale-105' : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <img
                      src={`http://127.0.0.1:5000${img.url}`}
                      alt=""
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive QR Code Modal */}
      {isQrModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative text-center border border-slate-100 flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all duration-200"
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div>
              <h3 className="font-black text-slate-800 text-lg">Código QR de la Propiedad</h3>
              <p className="text-xs text-slate-400 mt-1">Escanéalo directamente para abrir la ficha técnica desde tu dispositivo móvil.</p>
            </div>

            {/* QR Code Wrapper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`}
                alt="Código QR de la propiedad"
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Details */}
            <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 py-2 px-4 rounded-xl w-full truncate">
              {property.titulo}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
