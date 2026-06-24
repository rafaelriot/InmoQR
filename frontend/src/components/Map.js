'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Locate } from 'lucide-react';

// Fix default marker icon issue in Leaflet + Webpack/Next.js
const fixLeafletIcon = () => {
  if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

fixLeafletIcon();

// Helper component to update map center dynamically
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Geolocation control component
function LocateControl({ onChange, readOnly }) {
  const map = useMap();

  const handleLocate = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
        if (!readOnly && onChange) {
          onChange([latitude, longitude]);
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        alert('No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador.');
      }
    );
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: '80px', pointerEvents: 'auto' }}>
      <div className="leaflet-control leaflet-bar border-0 shadow-md">
        <button
          type="button"
          onClick={handleLocate}
          title="Centrar en mi ubicación"
          className="bg-white hover:bg-slate-50 text-slate-700 p-2 flex items-center justify-center transition-colors border-0 cursor-pointer rounded"
          style={{ width: '34px', height: '34px', outline: 'none' }}
        >
          <Locate size={18} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}

// Click listener to pick coordinates (for creating/editing properties)
function MapEventsHandler({ onChange, readOnly }) {
  useMapEvents({
    click(e) {
      if (!readOnly && onChange) {
        onChange([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function Map({ center = [19.5428, -96.9272], zoom = 13, markers = [], onChange, readOnly = true }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Robustly parse center coords as floats
  const parsedCenter = [
    parseFloat(center[0]) || 19.5428,
    parseFloat(center[1]) || -96.9272
  ];
  
  const [markerPosition, setMarkerPosition] = useState(parsedCenter);
  const markerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setMarkerPosition(parsedCenter);
  }, [center]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 font-medium">
        Cargando mapa interactivo...
      </div>
    );
  }
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null && onChange) {
        const latLng = marker.getLatLng();
        onChange([latLng.lat, latLng.lng]);
      }
    },
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '350px' }}>
      <MapContainer
        center={parsedCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      >
        <ChangeMapView center={parsedCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onChange={onChange} readOnly={readOnly} />
        <LocateControl onChange={onChange} readOnly={readOnly} />

        {readOnly ? (
          // View mode: show list of markers
          markers.map((m, idx) => {
            const mLat = parseFloat(m.lat !== undefined ? m.lat : m.latitud);
            const mLng = parseFloat(m.lng !== undefined ? m.lng : m.longitud);
            
            if (isNaN(mLat) || isNaN(mLng)) return null;

            return (
              <Marker key={m.id || idx} position={[mLat, mLng]}>
                <Popup>
                  <div className="p-1">
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{m.titulo}</h4>
                    <p className="text-xs text-slate-500 mb-1">{m.ubicacion}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-xs font-bold text-blue-600">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(m.precio)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        m.estado === 'venta' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {m.estado}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        ) : (
          // Edit/Create mode: show single editable marker
          <Marker
            draggable={!readOnly}
            eventHandlers={eventHandlers}
            position={markerPosition}
            ref={markerRef}
          />
        )}
      </MapContainer>
    </div>
  );
}
