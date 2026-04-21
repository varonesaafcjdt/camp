"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';

// Constantes
const LOGO_URL = "/icons/logo-varones.png";
const ADMIN_ONLY_PATHS = ['/admin'];

// Opciones para configurar qué enlaces mostrar
interface NavbarProps {
  showInternalLinks?: boolean;
}

export default function Navbar({ showInternalLinks = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading, signOut, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSignOut = async () => {
    try {
      // Prevenir múltiples llamadas
      if (loading) return;
      
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      // Solo mostrar error si no es el error de sesión faltante
      if (!error?.message?.includes('Auth session missing')) {
        toast.error('Error al cerrar sesión');
      } else {
        // Si la sesión ya no existe, redirigir de todas formas
        router.push('/');
      }
    }
  };

  const isAdmin = hasRole('admin');
  const isEditor = hasRole('editor');
  const showInternalNav = showInternalLinks || isAdmin || isEditor;

  const createInternalLink = useCallback((path: string): string => {
    if (!user || loading) return path;
    if (ADMIN_ONLY_PATHS.includes(path)) {
      return isAdmin ? `${path}?internal_access=true` : '/registro';
    }
    return user ? `${path}?internal_access=true` : path;
  }, [user, loading, isAdmin]);

  const handleNavigation = useCallback((path: string) => {
    setIsOpen(false);
    const finalPath = createInternalLink(path);
    if (finalPath !== pathname) {
      window.location.href = finalPath;
    }
  }, [createInternalLink, pathname]);

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 w-full backdrop-blur-sm shadow-sm body-glassmorphisim">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const renderInternalNavLinks = () => (
    <>
      {isEditor && (
        <Link 
          href={createInternalLink('/comite')}
          className="text-black/70 hover:text-red-600 font-bold transition-colors uppercase text-sm tracking-widest"
          onClick={() => handleNavigation('/comite')}
        >
          Qr Scanner
        </Link>
      )}
      {isAdmin && (
        <Link 
          href={createInternalLink('/admin/caja')}
          className="text-black/70 hover:text-red-600 font-bold transition-colors uppercase text-sm tracking-widest"
          onClick={() => handleNavigation('/admin/caja')}
        >
          Caja
        </Link>
      )}
      {(isAdmin || isEditor) && (
        <Link 
          href={createInternalLink('/registro-presencial')}
          className="text-black/70 hover:text-red-600 font-bold transition-colors uppercase text-sm tracking-widest"
          onClick={() => handleNavigation('/registro-presencial')}
        >
          Walk-in
        </Link>
      )}
      {isAdmin && (
        <Link 
          href={createInternalLink('/admin')}
          className="text-slate-600 hover:text-primary font-semibold transition-colors uppercase text-sm tracking-widest"
          onClick={() => handleNavigation('/admin')}
        >
          Dashboard
        </Link>
      )}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleSignOut}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase text-sm tracking-widest"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Salir
      </Button>

    </>
  );

  const renderMobileMenu = () => (
    <div className={cn(
      "md:hidden transition-all duration-300 overflow-hidden",
      isOpen ? "max-h-96 border-b border-slate-200" : "max-h-0"
    )}>
      <div className="px-4 pt-2 pb-3 space-y-1 bg-white">
        <Link 
          href={user ? createInternalLink('/') : '/'}
          className="block w-full text-left px-3 py-2 text-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          onClick={() => handleNavigation('/')}
        >
          Inicio
        </Link>
        <Link 
          href={user ? createInternalLink('/registro') : '/registro'}
          className="block w-full text-left px-3 py-2 text-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          onClick={() => handleNavigation('/registro')}
        >
          Registro
        </Link>
        
        {showInternalNav && user && (
          <>
            {isEditor && (
              <Link 
                href={createInternalLink('/comite')}
                className="block w-full text-left px-3 py-2 text-black/70 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                onClick={() => handleNavigation('/comite')}
              >
                Qr Scanner
              </Link>
            )}
            {isAdmin && (
              <Link 
                href={createInternalLink('/admin/caja')}
                className="block w-full text-left px-3 py-2 text-black/70 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                onClick={() => handleNavigation('/admin/caja')}
              >
                Caja
              </Link>
            )}
            {(isAdmin || isEditor) && (
              <Link 
                href={createInternalLink('/registro-presencial')}
                className="block w-full text-left px-3 py-2 text-black/70 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                onClick={() => handleNavigation('/registro-presencial')}
              >
                Walk-in
              </Link>
            )}
            {isAdmin && (
              <Link 
                href={createInternalLink('/admin')}
                className="block w-full text-left px-3 py-2 text-black/70 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                onClick={() => handleNavigation('/admin')}
              >
                Dashboard
              </Link>
            )}
          </>
        )}
        
        {user && (
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive font-black uppercase tracking-widest hover:bg-destructive hover:text-white py-2"
            onClick={() => {
              handleSignOut();
              setIsOpen(false);
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "navbar-scrolled" 
          : "bg-transparent"
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link
              href={user ? createInternalLink('/') : '/'}
              className="flex items-center space-x-2"
              onClick={() => handleNavigation('/')}
            >
            </Link>
            
            {showInternalNav && user && (
              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                <Shield className="h-3 w-3 mr-1" /> 
                {isAdmin ? 'Admin' : isEditor ? 'Comité' : 'Acceso Interno'}
              </Badge>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href={user ? createInternalLink('/') : '/'} 
              className="text-black font-black uppercase text-sm tracking-[0.2em] hover:text-red-600 transition-colors"
              onClick={() => handleNavigation('/')}
            >
              Inicio
            </Link>
            <Link 
              href={user ? createInternalLink('/registro') : '/registro'} 
              className="text-slate-600 font-bold uppercase text-sm tracking-[0.15em] hover:text-primary transition-colors"
              onClick={() => handleNavigation('/registro')}
            >
              Registro
            </Link>

            
            {showInternalNav && user && renderInternalNavLinks()}
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>
      
      {renderMobileMenu()}
    </nav>
  );
}