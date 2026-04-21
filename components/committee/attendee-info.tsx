"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, QrCode, ShieldCheck, Shirt, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaz sencilla para los datos del asistente
interface AttendeeData {
  id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  church?: string;
  sector?: string;
  paymentamount?: number;
  paymentstatus?: string;
  created_at?: string;
  tshirtsize?: string;
  attendance_number?: number;
  attendance_confirmed?: boolean;
  attendance_confirmed_at?: string;
}

interface AttendeeInfoProps {
  attendee: AttendeeData | null;
  onConfirmAttendance?: (id: string) => void;
}

export default function AttendeeInfo({ attendee, onConfirmAttendance }: AttendeeInfoProps) {
  // Si no hay datos, mostrar mensaje para escanear QR
  if (!attendee) {
    return (
      <Card className="card-clear w-full min-h-dvh max-h-dvh overflow-hidden">

        <CardHeader>
          <CardTitle className="relative text-center text-white">
            <span className="absolute left-0">
              <User className="text-muted-foreground" />
            </span>
            Información del Asistente
          </CardTitle>

        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
          <User className="h-10 w-10 mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            Escanee un código QR para ver la información del asistente
          </p>
        </CardContent>
      </Card>

    );
  }

  // Obtener el estado de pago
  const paymentStatus = attendee.paymentstatus || '';
  const isPaid = paymentStatus.toLowerCase().includes('pagado');

  // Formatear nombre completo
  const fullName = [attendee.firstname, attendee.lastname]
    .filter(Boolean)
    .join(' ') || 'No disponible';

  // Formatear fecha si existe
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha no disponible';
    }
  }
    ;
  return (
    <Card className="card-clear w-full border-2 border-primary/20 shadow-xl overflow-hidden">
      <CardHeader className="p-4 sm:p-6 bg-primary/5 border-b border-primary/10">
        <CardTitle className="font-black text-center text-xl sm:text-2xl tracking-tight text-primary uppercase">
          {fullName}
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm font-mono text-muted-foreground mt-1">
          ID: {attendee.id}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-white">
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="p-4 bg-primary/10 rounded-2xl shadow-inner transition-all hover:scale-110">
            <QrCode className="h-10 w-10 sm:h-14 sm:w-14 text-primary animate-pulse" />
          </div>
        </div>

        <div className={`flex items-center justify-center border-2 border-dashed p-3 rounded-xl mb-2 transition-colors ${attendee.attendance_confirmed
          ? 'border-green-500/50 bg-green-50'
          : 'border-amber-500/50 bg-amber-50'
          }`}>
          <div className="flex items-center gap-2">
            {attendee.attendance_confirmed ? (
              <>
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <div className="flex flex-col text-left">
                  <span className="font-black text-green-800 text-xs sm:text-sm uppercase tracking-wider">
                    Asistencia Confirmada
                  </span>
                  <span className="text-[10px] sm:text-xs text-green-600 font-bold">
                    ENTRADA # {attendee.attendance_number}
                  </span>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 animate-bounce" />
                <span className="font-black text-amber-800 text-xs sm:text-sm uppercase tracking-wider">
                  Pendiente de Confirmar
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mostrar si es acreedor a camiseta */}
        <div className="flex justify-center">
          {attendee.tshirtsize ? (
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 shadow-lg transform -rotate-1">
              <Shirt className="h-4 w-4" />
              TALLA: <span className="text-lg ml-1">{attendee.tshirtsize}</span>
            </div>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-dashed">SIN CAMISETA</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-left">Teléfono</p>
            <p className="text-sm font-bold text-slate-800 break-all text-left">{attendee.phone || 'No disponible'}</p>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-left">Email</p>
            <p className="text-sm font-bold text-slate-800 break-all text-left">{attendee.email || 'No disponible'}</p>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-left">Iglesia</p>
            <p className="text-sm font-bold text-slate-800 text-left">{attendee.church || 'No disponible'}</p>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-left">Sector</p>
            <p className="text-sm font-bold text-slate-800 text-left">{attendee.sector || 'No disponible'}</p>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-left">Estado de Pago</p>
            <div className="pt-1 text-left">
              {attendee.paymentstatus ? (
                <Badge className={`font-black px-3 py-1 ${isPaid
                  ? 'bg-green-600 text-white'
                  : paymentStatus.toLowerCase().includes('pendiente')
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-400 text-white'
                  }`}>
                  {attendee.paymentstatus.toUpperCase()}
                </Badge>
              ) : <span className="text-sm font-bold">N/A</span>}
            </div>
          </div>
        </div>

        <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center">
          <p className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Monto Pagado</p>
          <p className="text-xl font-black text-primary">
            {attendee.paymentamount ? `$${attendee.paymentamount}` : '$0.00'}
          </p>
        </div>

        {!attendee.attendance_confirmed && (
          <Button
            onClick={() => onConfirmAttendance && attendee.id && onConfirmAttendance(attendee.id)}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-black py-6 text-lg uppercase tracking-tighter shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            size="lg"
          >
            Confirmar Asistencia
          </Button>
        )}
      </CardContent>
    </Card>
  );
}