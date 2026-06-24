'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowLeft, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SellerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('token')) {
      router.push('/seller/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin
      ? { email, password }
      : { nombre, telefono, email, password };

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Ocurrió un error en el proceso');
      }

      // Save token and seller info
      localStorage.setItem('token', data.token);
      localStorage.setItem('vendedor', JSON.stringify(data.vendedor));

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
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            IQ
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            {isLogin ? 'Acceso exclusivo para asesores inmobiliarios InmoQR' : 'Crea tu perfil de asesor para comenzar a publicar'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    required
                    placeholder="555-0199"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : isLogin ? (
              <>
                <LogIn size={16} />
                <span>Ingresar al Sistema</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Registrar Perfil</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6 pt-6 border-t border-slate-100 text-xs">
          {isLogin ? (
            <p className="text-slate-500">
              ¿No tienes cuenta de asesor?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="font-bold text-blue-600 hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              ¿Ya tienes cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="font-bold text-blue-600 hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}
        </div>
      </div>
      
      <div className="text-center mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-semibold"
        >
          <ArrowLeft size={12} />
          <span>Volver al portal público</span>
        </Link>
      </div>
    </div>
  );
}
