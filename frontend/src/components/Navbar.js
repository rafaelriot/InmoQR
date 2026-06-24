'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, User, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const seller = localStorage.getItem('vendedor');
    if (token && seller) {
      setIsLoggedIn(true);
      try {
        setSellerName(JSON.parse(seller).nombre);
      } catch (e) {
        setSellerName('Vendedor');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendedor');
    setIsLoggedIn(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-blue-600 tracking-tight">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Home size={20} />
              </span>
              <span>Inmo<span className="text-slate-800">QR</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Explorar Propiedades
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-xs text-slate-500 font-medium">
                  Hola, {sellerName}
                </span>
                <Link
                  href="/seller/dashboard"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-all"
                >
                  <LayoutDashboard size={14} />
                  <span>Panel</span>
                </Link>
                <Link
                  href="/seller/properties/new"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-all"
                >
                  <PlusCircle size={14} />
                  <span>Publicar</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all"
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Salir</span>
                </button>
              </div>
            ) : (
              <Link
                href="/seller/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-all"
              >
                <User size={14} />
                <span>Acceso Vendedores</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
