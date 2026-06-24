import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "InmoQR - Encuentra Casas y Terrenos en Venta o Renta",
  description: "Catálogo interactivo inmobiliario con mapa Leaflet y generación de fichas técnicas en PDF con códigos QR.",
  keywords: "inmobiliaria, casas, terrenos, renta, venta, qrcode, leaflet, mapa interactivo"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Leaflet CSS from CDN */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossOrigin="" 
        />
        {/* Outfit Google Font */}
        <link 
          rel="preconnect" 
          href="https://fonts.googleapis.com" 
        />
        <link 
          rel="preconnect" 
          href="https://fonts.gstatic.com" 
          crossOrigin="anonymous" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white antialiased">
        <Navbar />
        <main className="flex-grow">
          <div className="animate-page-fade">
            {children}
          </div>
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1 rounded font-bold text-sm">IQ</span>
              <span className="font-bold text-white">InmoQR</span>
              <span className="text-xs text-slate-500">© {new Date().getFullYear()} Todos los derechos reservados.</span>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="hover:text-white cursor-pointer transition-colors">Aviso de Privacidad</span>
              <span className="hover:text-white cursor-pointer transition-colors">Términos de Servicio</span>
              <span className="hover:text-white cursor-pointer transition-colors">Soporte Técnico</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
