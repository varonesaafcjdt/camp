import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function FooterL() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 bg-white border-t-4 border-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-black uppercase tracking-tighter">
              GENERACIÓN <span className="text-red-600">A GENERACIÓN</span>
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">
              Campamento Distrital de Varones 2026
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="flex items-center text-xs font-black uppercase tracking-widest">
              Hecho con <Heart size={14} className="mx-1.5 text-red-600 fill-red-600" /> para el Distrito
            </p>
            <p className="text-[10px] font-bold opacity-50">
              &copy; {currentYear} MDP Noroeste. Todos los derechos reservados.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs font-black uppercase tracking-widest mb-1">Contacto</p>
            <a href="mailto:soporte@mdpnoroeste.org" className="text-xs font-bold hover:text-red-600 transition-colors">
              soporte@mdpnoroeste.org
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}