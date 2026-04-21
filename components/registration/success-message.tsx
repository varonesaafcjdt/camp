"use client";

import { useRef } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface SuccessMessageProps {
  qrData: string | null;
  onReset: () => void;
}

export const SuccessMessage = ({ qrData, onReset }: SuccessMessageProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadQR = () => {
    console.log('Iniciando descarga del QR');
    if (!qrData) {
      console.warn('No hay datos de QR para descargar');
      return;
    }
    
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            try {
              const qrDataObj = JSON.parse(qrData);
              const fileName = qrDataObj.nombre || 'asistente';
              link.download = `qr-${fileName.replace(/\s+/g, '-')}.png`;
            } catch (e) {
              link.download = `qr-asistente.png`;
            }
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  if (!qrData) {
    console.warn('No hay datos de QR disponibles para mostrar');
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">
          No se pudieron generar los datos del registro. Por favor, intente nuevamente.
        </p>
        <Button onClick={() => handleNavigation('/registro')}>
          Volver al formulario
        </Button>
      </div>
    );
  }

  let attendeeId = '';
  if (qrData && qrData.startsWith('id:')) {
    attendeeId = qrData.replace('id:', '');
  }
  
  return (
    <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-black rounded-none flex items-center justify-center mx-auto mb-6 border-4 border-black rotate-3">
        <CheckCircle2 className="h-12 w-12 text-white -rotate-3" />
      </div>
      
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">¡REGISTRO COMPLETADO!</h2>
      
      <p className="font-bold mb-8">
        Gracias por registrarte al <span className="text-red-600">GENERACIÓN A GENERACIÓN 2026</span>. Tu registro ha sido procesado exitosamente.<br /><br />
        <span className="bg-red-50 p-2 border border-red-200 inline-block">
          Hemos enviado un correo de confirmación. Revisa tu bandeja de entrada o spam.
        </span>
      </p>
      
      <div className="border-4 border-black border-dashed p-6 mb-8 bg-gray-50">
        <h3 className="font-black uppercase tracking-widest mb-4">TU CÓDIGO QR DE ACCESO</h3>
        
        <div className="flex justify-center mb-6" ref={qrRef}>
          <div className="bg-white p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {qrData && (
              <QRCodeSVG 
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
                style={{ width: '200px', height: '200px' }}
              />
            )}
          </div>
        </div>
        
        <p className="text-sm font-bold uppercase tracking-wider mb-6">
          PRESENTA ESTE CÓDIGO AL INGRESAR AL EVENTO. <br />
          <span className="text-red-600 font-black text-lg">ID: {attendeeId}</span>
        </p>
        
        <Button
          onClick={handleDownloadQR}
          className="w-full bg-black text-white hover:bg-red-600 font-black uppercase py-6 rounded-none transition-all"
        >
          <Download className="mr-2 h-5 w-5" />
          DESCARGAR QR
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => handleNavigation('/')} className="flex-1 bg-white text-black border-2 border-black hover:bg-black hover:text-white font-black uppercase py-6 rounded-none transition-all">
          INICIO
        </Button>
        
        <Button onClick={onReset} className="flex-1 bg-white text-black border-2 border-black hover:bg-black hover:text-white font-black uppercase py-6 rounded-none transition-all">
          NUEVO REGISTRO
        </Button>
      </div>

    </div>
  );
}