"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from '@/components/shared/navbar';
import FooterL from '@/components/shared/footerL';
import RegistrationForm from '@/components/registration/registration-form';
import dynamic from 'next/dynamic';

const SuccessMessage = dynamic(() => import('@/components/registration/success-message').then(mod => mod.SuccessMessage), {
  ssr: false,
  loading: () => <div className="p-8 text-center bg-white border-2 border-black max-w-2xl mx-auto"><p className="font-bold">Generando código QR...</p></div>
});

interface AttendeeData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  church: string;
  sector: string;
  paymentamount: number;
  paymentstatus: string;
  registrationdate: string;
  paymentreceipturl: string;
}

export default function RegistroPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [registroCerrado, setRegistroCerrado] = useState(false);

  useEffect(() => {
    // Fecha límite: 3 de junio de 2026, 23:59:59 (día antes del campamento)
    const fechaLimite = new Date('2026-06-03T23:59:59');
    const ahora = new Date();
    if (ahora > fechaLimite) {
      setRegistroCerrado(true);
    }
  }, []);

  const handleSuccessfulSubmission = (data: AttendeeData, qrCode: string) => {
    console.log('RegistroPage - handleSuccessfulSubmission recibió:');
    console.log('- data:', data);
    console.log('- qrCode:', qrCode);

    // Usar directamente el qrCode si existe
    if (qrCode) {
      console.log('RegistroPage - Usando qrCode recibido directo del formulario');
      setQrData(qrCode);
    } else {
      // Fallback: crear un formato similar al esperado
      console.log('RegistroPage - Creando un nuevo objeto QR a partir de los datos');
      const fallbackQrData = {
        id: data.id,
        nombre: `${data.firstname} ${data.lastname}`,
        email: data.email,
        iglesia: data.church,
        sector: data.sector,
        monto: data.paymentamount,
        estado: data.paymentstatus,
        fecha: data.registrationdate
      };
      setQrData(JSON.stringify(fallbackQrData));
    }

    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-grainy">
      <div className="absolute inset-0 bg-wavy opacity-10 pointer-events-none z-0" />
      <Navbar showInternalLinks={false} />

      <div className="flex-1 py-12 relative z-10">
        {registroCerrado ? (
          <div className="flex flex-1 min-h-[60vh] items-center justify-center">
            <div className="text-center p-8 card-brutalist max-w-2xl mx-4">
              <h1 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tighter">¡Registro Terminado!</h1>
              <p className="text-lg font-bold mb-6">El registro en línea está cerrado, pero aún puedes ser parte del campamento.</p>
              <p className="text-md mb-4">🏕️ Solo llega el día del evento y 📝 regístrate en el área de bienvenida.</p>
              <div className="border-2 border-black p-4 mb-6 bg-red-50">
                <p className="font-black text-lg uppercase tracking-widest">📅 Campamento</p>
                <p className="text-3xl font-black">4 — 6 Junio</p>
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">2026</p>
              </div>
              <p className="text-xl font-black text-red-600">¡TE ESPERAMOS!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {isSubmitted ? (
              <SuccessMessage
                qrData={qrData}
                onReset={() => {
                  setIsSubmitted(false);
                  setQrData(null);
                }}
              />
            ) : (
              <>
                <div className="text-center mb-10">
                  <h1 className="text-stencil text-4xl md:text-6xl text-black inline-block relative">
                    REGISTRO
                    <span className="absolute -top-4 -right-12 text-cursive text-3xl -rotate-12">Oficial</span>
                  </h1>
                  <h2 className="text-metallic text-2xl md:text-4xl mt-2">GENERACIÓN A GENERACIÓN</h2>
                  <p className="text-lg font-bold uppercase tracking-widest mt-4 opacity-70">
                    Campamento Distrital de Varones 2026
                  </p>
                  <div className="inline-flex items-center gap-3 mt-4 border-2 border-black px-6 py-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-sm font-black uppercase tracking-widest">📅 Campamento:</span>
                    <span className="text-lg font-black text-red-600">4 — 6 de Junio 2026</span>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-10 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <RegistrationForm onSuccess={handleSuccessfulSubmission} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <FooterL />
    </div>
  );
}