'use client'
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import LoginForm from '@/components/admin/login-form';
import { supabase } from '@/lib/supabase';
import { CHURCHES_DATA } from '@/lib/churches-data';
import { toast } from 'sonner';
import { getNextAttendanceNumber } from '@/lib/utils';

const ROLES = [
  { label: 'Campista', value: 'campista', monto: 900 },
  { label: 'Pastor', value: 'pastor', monto: 0 },
  { label: 'Esposa de Pastor', value: 'esposa', monto: 600 },
  { label: 'Ujier', value: 'ujier', monto: 700 },
  { label: 'Multimedia', value: 'multimedia', monto: 700 },
  { label: 'Registro', value: 'registro', monto: 700 },
  { label: 'Comite', value: 'comite', monto: 0 },
];

export default function RegistroPresencial() {
  const { user, loading, error: authError, hasRole } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    iglesia: '',
    telefono: '',
    rol: ROLES[0].value,
    notas: '',
  });
  const [monto, setMonto] = useState(ROLES[0].monto);
  const [numeroCampista, setNumeroCampista] = useState<number | null>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sector, setSector] = useState('');
  const [ultimoId, setUltimoId] = useState<string | null>(null);

  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sector || (sector === 'Foráneo' && church.sector === 'Foráneo')
  );

  // Spinner de carga
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-r-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass border rounded-lg shadow p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene permisos
  if (!hasRole('admin') && !hasRole('editor')) {
    return (
      <div className="min-h-screen flex flex-col bg-try">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Sin permisos</h2>
            <p>No tienes permisos para acceder a esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  // Validar teléfono: solo números y 10 dígitos
  const isTelefonoValido = (telefono: string) => {
    const soloNumeros = telefono.replace(/\D/g, '');
    return soloNumeros.length === 10;
  };

  // Buscar duplicados por nombre y/o teléfono
  const checkDuplicate = async () => {
    const { data, error } = await supabase
      .from('attendees')
      .select('id')
      .or(`firstname.ilike.%${form.nombre}%,lastname.ilike.%${form.apellido}`);
    return data && data.length > 0;
  };

  const limpiarFormulario = () => {
    setForm({ nombre: '', apellido: '', iglesia: '', telefono: '', rol: ROLES[0].value, notas: '' });
    setMonto(ROLES[0].monto);
    setSector('');
    setNumeroCampista(null);
    setUltimoId(null);
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      // Solo permitir números y máximo 10 dígitos
      const soloNumeros = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, telefono: soloNumeros }));
      return;
    }
    if (name === 'sector') {
      setSector(value);
      setForm(prev => ({ ...prev, iglesia: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'rol') {
      const rolSeleccionado = ROLES.find(r => r.value === value);
      setMonto(rolSeleccionado ? rolSeleccionado.monto : 900);
    }
  };

  // Insertar en la base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Registrando campista...');
    try {
      // Validar teléfono
      if (!isTelefonoValido(form.telefono)) {
        toast.error('El teléfono debe tener exactamente 10 dígitos.', { id: toastId });
        setIsSubmitting(false);
        return;
      }
      // Validar duplicados
      const existe = await checkDuplicate();
      /*if (existe) {
        toast.error('Ya existe un registro con ese nombre o teléfono.', { id: toastId });
        setIsSubmitting(false);
        return;
      }*/
      const nuevoNumero = await getNextAttendanceNumber();
      setNumeroCampista(nuevoNumero);
      // Insertar registro
      const { data: insertData, error: insertError } = await supabase.from('attendees').insert({
        firstname: form.nombre,
        lastname: form.apellido,
        email: '', // Correo eliminado del formulario walk-in
        church: form.iglesia,
        sector: sector,
        phone: form.telefono,
        notes: form.notas,
        paymentamount: 0,
        expectedamount: monto,
        paymentstatus: 'Pendiente',
        attendance_number: nuevoNumero,
        registrationdate: new Date().toISOString(),
      }).select('id').single();
      console.log('insert attendee:', { insertData, insertError });
      if (insertError) throw insertError;
      setUltimoId(insertData?.id || null);
      toast.success('¡Registro exitoso!', { id: toastId });
      // No limpiar aquí, para mostrar botones de acción
    } catch (error: any) {
      toast.error('Error al registrar campista: ' + (error?.message || error), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marcar como pagado
  const marcarComoPagado = async () => {
    if (!ultimoId) return;
    const { error } = await supabase.from('attendees').update({ paymentstatus: 'Pagado', paymentamount: monto }).eq('id', ultimoId);
    if (!error) {
      toast.success('¡Marcado como pagado!');
      setNumeroCampista(null);
      setUltimoId(null);
      limpiarFormulario();
    } else {
      toast.error('Error al actualizar el pago.');
    }
  };

  // Responsive y botones más compactos
  const inputClass = "w-full text-sm text-black border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80";
  const buttonClass = "w-full sm:w-auto px-4 py-2 rounded text-sm font-semibold";

  return (
    <div className="min-h-screen flex flex-col bg-try">
      <Navbar showInternalLinks={true} />
      
      <div className="flex-1 py-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h1 className="text-stencil text-3xl md:text-5xl text-pure-black inline-block relative">
              WALK-IN
              <span className="absolute -top-3 -right-10 text-cursive text-2xl -rotate-12">Registro</span>
            </h1>
            <h2 className="text-premium text-xl md:text-3xl mt-2 uppercase">Panel Administrativo</h2>
            <p className="text-sm font-bold uppercase tracking-widest mt-2 opacity-70">
              Inscripción Presencial — Varones AAFCJ 2026
            </p>
          </div>

          <div className="card-glass p-6 md:p-10 border border-slate-200 shadow-xl max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre(s) <span className="text-red-600">*</span></label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"} autoFocus tabIndex={1} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Apellido(s) <span className="text-red-600">*</span></label>
                  <input name="apellido" value={form.apellido} onChange={handleChange} required className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"} tabIndex={2} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Teléfono <span className="text-red-600">*</span></label>
                  <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} required className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"} tabIndex={3} maxLength={10} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sector <span className="text-red-600">*</span></label>
                  <select
                    name="sector"
                    value={sector}
                    onChange={handleChange}
                    className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"}
                    required
                    tabIndex={5}
                  >
                    <option value="">Seleccione sector</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="Foráneo">Foráneo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Iglesia <span className="text-red-600">*</span></label>
                  <select
                    name="iglesia"
                    value={form.iglesia}
                    onChange={handleChange}
                    className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"}
                    required
                    disabled={!sector}
                    tabIndex={6}
                  >
                    <option value="">{sector ? 'Seleccione iglesia' : 'Primero seleccione sector'}</option>
                    {filteredChurches.map((church) => (
                      <option key={`${church.sector}-${church.name}`} value={church.name}>{church.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rol <span className="text-red-600">*</span></label>
                  <select
                    name="rol"
                    value={form.rol}
                    onChange={handleChange}
                    className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10"}
                    required
                    tabIndex={7}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monto a pagar</label>
                  <div className="h-10 flex items-center px-3 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-700">
                    ${monto}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notas adicionales</label>
                <textarea 
                  name="notas" 
                  value={form.notas} 
                  onChange={handleChange} 
                  className={inputClass + " border-slate-200 focus:border-red-600 focus:ring-red-600/10 h-20 resize-none"} 
                  tabIndex={9} 
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-white hover:bg-primary/95 px-6 py-3 rounded font-black uppercase text-sm tracking-widest transition-all shadow-md active:scale-[0.98]" 
                  disabled={isSubmitting} 
                  tabIndex={10}
                >
                  {isSubmitting ? 'Registrando...' : 'Finalizar Registro'}
                </button>
                <button 
                  type="button" 
                  className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded font-bold uppercase text-sm tracking-widest transition-colors" 
                  onClick={limpiarFormulario} 
                  disabled={isSubmitting} 
                  tabIndex={11}
                >
                  Limpiar
                </button>
              </div>
            </form>

            {numeroCampista && (
              <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-lg text-center animate-fade-in shadow-inner">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                   </svg>
                </div>
                <h3 className="text-green-800 font-bold text-lg mb-1">¡Registro Completado!</h3>
                <p className="text-green-700 text-sm mb-4">Número de campista asignado:</p>
                <div className="text-4xl font-black text-green-800 mb-6 font-mono tracking-tighter">
                  #{numeroCampista.toString().padStart(3, '0')}
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    className="w-full bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded font-bold uppercase text-sm tracking-widest transition-all shadow-sm"
                    onClick={marcarComoPagado}
                    disabled={!ultimoId}
                  >
                    Marcar como pagado
                  </button>
                  <button
                    className="w-full text-slate-600 hover:text-slate-800 text-sm font-bold uppercase tracking-widest"
                    onClick={limpiarFormulario}
                  >
                    Registrar otro campista
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}