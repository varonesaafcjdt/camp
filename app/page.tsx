import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import FooterL from '@/components/shared/footerL';
import Navbar from '@/components/shared/navbar';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen relative bg-grainy">
      <div className="absolute inset-0 bg-wavy opacity-10 pointer-events-none" />
      <Navbar showInternalLinks={false} />

      <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-4 py-12">
        <div className="max-w-4xl w-full text-center space-y-2">
          <p className="text-sm md:text-base font-black tracking-widest text-[#000] uppercase mb-4 opacity-80">
            Campamento Distrital de Varones
          </p>

          <div className="relative inline-block">
            {/* AVIVA Stencil */}
            <h1 className="text-[11vw] md:text-[90px] leading-tight text-stencil text-black select-none">
              GENERACIÓN
            </h1>

            {/* AVIVA Accent Script */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8vw] md:text-[60px] text-cursive whitespace-nowrap -rotate-6 filter drop-shadow-lg pointer-events-none">
              a
            </span>
          </div>

          <div className="mt-[-10px] md:mt-[-20px]">
            <h2 className="text-[9vw] md:text-[70px] leading-none text-metallic uppercase select-none">
              GENERACIÓN
            </h2>
          </div>

          <div className="pt-12 flex flex-col items-center gap-6">
            {/* Pre-camp date */}
            <div className="text-center group">
              <p className="font-bold text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Precampamento</p>
              <p className="font-black text-xl uppercase tracking-tighter">Sábado</p>
              <p className="text-5xl font-black leading-none -mt-1 group-hover:scale-110 transition-transform">25</p>
              <p className="font-black text-lg uppercase tracking-widest border-t-2 border-black mt-1">De Abril</p>
            </div>

            {/* Divider */}
            <div className="text-2xl font-black opacity-30">·····</div>

            {/* Camp dates */}
            <div className="text-center border-4 border-black px-8 py-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-black text-xs uppercase tracking-[0.3em] text-red-600 mb-1">Campamento</p>
              <p className="text-4xl md:text-5xl font-black leading-none">4 — 6</p>
              <p className="font-black text-xl uppercase tracking-widest border-t-2 border-black mt-1">Junio 2026</p>
            </div>

            <Link href="/registro">
              <Button size="lg" className="bg-black text-white hover:bg-red-600 px-12 py-8 text-xl font-black rounded-none border-2 border-black hover:translate-x-1 hover:-translate-y-1 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]">
                REGISTRARME AHORA
              </Button>
            </Link>

            <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-60">
              Próximamente más información
            </p>
          </div>
        </div>
      </div>

      {/* Decorative hands image - using a filter to match B&W style */}
      <div className="absolute bottom-0 w-full h-1/3 z-0 overflow-hidden opacity-20 md:opacity-40 pointer-events-none grayscale contrast-125">
        <Image
          src="https://res.cloudinary.com/dmjdrou6a/image/upload/v1749485060/Fondo_1_czgmbm.png"
          alt="Atmosphere"
          fill
          className="object-cover object-top"
          sizes="100vw"
        />
      </div>

      <FooterL />
    </main>
  );
}