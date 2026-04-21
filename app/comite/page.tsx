"use client";

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import LoginForm from '@/components/committee/login-form';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import FooterL from '@/components/shared/footerL';

// Lazy load componentes pesados
const QrScanner = lazy(() => import('@/components/committee/qr-scanner'));
const AttendeeInfo = lazy(() => import('@/components/committee/attendee-info'));

// Componente de carga para Suspense
const LoadingFallback = () => (
  <div className="w-full h-48 flex items-center justify-center">
    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
    <p className="ml-2 text-sm text-muted-foreground">Cargando componente...</p>
  </div>
);

// Definir la interfaz para los datos del asistente
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
  created_at: string;
  attendance_number: number;
  attendance_confirmed: boolean;
  attendance_confirmed_at: string;
  tshirtsize?: string;
}

export default function ComitePage() {
  const { user, loading, error, signOut, hasRole } = useAuth();
  const router = useRouter();
  const [attendee, setAttendee] = useState<AttendeeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedQR, setLastScannedQR] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  // Verificación de permisos
  useEffect(() => {
    if (user) {
      const hasEditorRole = hasRole('editor');
      const hasAdminRole = hasRole('admin');
      
      if (!hasEditorRole && !hasAdminRole) {
        toast.error('No tienes permisos para acceder a esta página', {duration: 2000});
        router.push('/');
      } else if (!hasShownWelcome) {
        toast.success(`¡Hola de nuevo!`, {
          description: user.email,
          id: 'welcome-toast',
          duration: 3000 
        });
        setHasShownWelcome(true);
      }
    }
  }, [user, hasRole, router, hasShownWelcome]);

  // Función para manejar el escaneo del QR
  const handleQrScan = async (result: string) => {
    // Prevenir escaneos múltiples rápidos
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      toast.warning('Por favor espere antes de escanear otro código', { 
        id: 'scan-warning',
        duration: 2000 
      });
      return;
    }
    setLastScanTime(now);

    // Limpiar estado anterior
    setIsLoading(true);
    setAttendee(null);
    setLastScannedQR(result);
    setScanCount(prev => prev + 1);

    // Crear un único toast con ID único
    const toastId = `qr-scan-${Date.now()}`;
    toast.loading('Escaneando código QR...', { id: toastId });

    try {
      // Extraer el ID del asistente del QR
      const attendeeId = extractAttendeeId(result);
      
      if (!attendeeId) {
        toast.error('No se pudo extraer un ID válido del QR', { id: toastId });
        setIsLoading(false);
        setAttendee(null);
        return;
      }
      
      // Consultar la base de datos con el ID extraído
      const { data, error } = await supabase
        .from('attendees')
        .select('id, firstname, lastname, email, phone, church, sector, paymentamount, paymentstatus, created_at, attendance_number, attendance_confirmed, attendance_confirmed_at, tshirtsize')
        .eq('id', attendeeId)
        .single();
        
      if (error) {
        console.error('Error al consultar la base de datos:', error);
        toast.error('Error al consultar la base de datos', { id: toastId });
        setIsLoading(false);
        setAttendee(null);
        return;
      }
      
      if (!data) {
        toast.error('No se encontró el asistente en la base de datos', { id: toastId });
        setIsLoading(false);
        setAttendee(null);
        return;
      }
      
      setAttendee(data as AttendeeData);
      toast.success('Información cargada correctamente', { id: toastId });

      // Validar que los datos estén completos
      if (!data.firstname || !data.lastname || !data.phone) {
        toast.warning('Algunos datos del asistente están incompletos', { 
          id: 'incomplete-data-warning',
          duration: 3000 
        });
      }
      
    } catch (err) {
      console.error('Error al procesar el QR:', err);
      toast.error('Error al procesar el código QR', { id: toastId });
      setAttendee(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función optimizada para extraer el ID del asistente
  const extractAttendeeId = (qrData: string): string | null => {
    try {
      if (!qrData) return null;
      
      const cleanQrData = qrData.trim();
      console.log('Procesando datos QR:', cleanQrData);
      
      // Caso 0: Formato directo id:UUID (formato actual de la app)
      if (cleanQrData.startsWith('id:')) {
        const id = cleanQrData.substring(3).trim();
        if (id) return id;
      }

      // Caso 1: Si es una URL, intentar extraer el parámetro 'id'
      if (cleanQrData.startsWith('http')) {
        try {
          const url = new URL(cleanQrData);
          const idParam = url.searchParams.get('id');
          if (idParam) return idParam;
          
          // Si no hay parámetro id, buscar un UUID en la ruta
          const pathSegments = url.pathname.split('/');
          const uuidInPath = pathSegments.find(segment => 
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(segment)
          );
          if (uuidInPath) return uuidInPath;
        } catch (e) {
          // No es una URL válida, continuar
        }
      }
      
      // Caso 2: Tratar como JSON
      if (cleanQrData.includes('{') && cleanQrData.includes('}')) {
        try {
          // Intentar limpiar JSON si tiene texto antes o después
          const start = cleanQrData.indexOf('{');
          const end = cleanQrData.lastIndexOf('}');
          const jsonContent = cleanQrData.substring(start, end + 1);
          
          const parsedData = JSON.parse(jsonContent);
          const id = parsedData?.id || parsedData?.ID || parsedData?.Id || parsedData?.attendeeId;
          if (id) return String(id);
        } catch (jsonError) {
          // JSON malformado, continuar con regex
        }
      }
      
      // Caso 3: Buscar UUID con guiones
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const matches = cleanQrData.match(uuidRegex);
      if (matches && matches[0]) return matches[0];
      
      // Caso 4: Buscar UUID sin guiones (32 caracteres hex)
      const plainUuidRegex = /[0-9a-f]{32}/i;
      const plainMatches = cleanQrData.match(plainUuidRegex);
      if (plainMatches && plainMatches[0]) return plainMatches[0];
      
      // Caso 5: Texto simple (si es corto y no tiene espacios, podría ser el ID directo)
      if (cleanQrData.length > 0 && cleanQrData.length < 60) {
        if (!cleanQrData.includes(' ') && !cleanQrData.includes('\n')) {
          // Si llegamos aquí y empieza con 'id:', ya lo manejamos en el Caso 0,
          // pero por si acaso hay variaciones como 'ID:' o 'Id:'
          if (cleanQrData.toLowerCase().startsWith('id:')) {
            return cleanQrData.substring(3).trim();
          }
          return cleanQrData;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error al extraer ID del QR:', err);
      return null;
    }
  };
  
  // Función para confirmar asistencia
  const confirmAttendance = async (id: string) => {
    try {
      // Obtener el último número de asistencia
      const { data: lastAttendee, error: lastError } = await supabase
        .from('attendees')
        .select('attendance_number')
        .not('attendance_number', 'is', null)
        .order('attendance_number', { ascending: false })
        .limit(1)
        .single();

      if (lastError && lastError.code !== 'PGRST116') {
        throw lastError;
      }

      // Calcular el nuevo número de asistencia
      const nextAttendanceNumber = (lastAttendee?.attendance_number || 0) + 1;

      // Actualizar el asistente con el número y la confirmación
      const { error: updateError } = await supabase
        .from('attendees')
        .update({
          attendance_number: nextAttendanceNumber,
          attendance_confirmed: true,
          attendance_confirmed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success(`Asistencia Confirmada`, {
        description: `${attendee?.firstname || ''} ${attendee?.lastname || ''} - #${nextAttendanceNumber}`,
        id: 'attendance-confirmed',
        duration: 4000
      });
      
      // Recargar el asistente actualizado desde la base de datos
      let { data, error } = await supabase
        .from('attendees')
        .select('id, firstname, lastname, email, phone, church, sector, paymentamount, paymentstatus, created_at, attendance_number, attendance_confirmed, attendance_confirmed_at, tshirtsize')
        .eq('id', id)
        .single();

      if (!error && data) {
        setAttendee(data);
      }
    } catch (error) {
      console.error('Error al confirmar asistencia:', error);
      toast.error('Error al confirmar la asistencia', {
        id: 'attendance-error',
        duration: 4000
      });
    }
  };

  // Si el usuario no está autenticado, mostrar formulario de inicio de sesión
  if (!user) {
    return (
      <div className="bg-try min-h-screen flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card-glass shadow-lg border border-border rounded-lg p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6">Iniciar sesión - Comité</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }
  
  // Si hay un error de autenticación, mostrar mensaje
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar showInternalLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-try min-h-screen flex flex-col">
      <Navbar showInternalLinks={true} />
      
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Panel del Comité</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Códigos escaneados: {scanCount} | Rol: {user.role}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground truncate">{user.email}</span>
              {/*<Button 
                variant="outline"
                onClick={signOut}
                className="whitespace-nowrap"
              >
                Cerrar sesión
              </Button> */}
            </div>
          </div>
          
          <Tabs defaultValue="scanner" className="mt-4 sm:mt-8">
            <TabsList className="grid grid-cols-1 w-full sm:w-[590px] mb-6 sm:mb-8">
              <TabsTrigger value="scanner">Escáner QR</TabsTrigger>
              {/* <TabsTrigger value="info">Información</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="scanner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="card-clear p-4 sm:p-6 rounded-lg shadow-sm border border-border">
                  <h2 className="relative text-center text-lg sm:text-xl font-semibold mb-4">Escáner de Código QR</h2>
                  <Suspense fallback={<LoadingFallback />}>
                    <QrScanner onScan={handleQrScan} />
                  </Suspense>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Suspense fallback={<LoadingFallback />}>
                    <AttendeeInfo 
                      attendee={attendee} 
                      onConfirmAttendance={confirmAttendance} 
                    />
                  </Suspense>
                </div>
              </div>
            </TabsContent>
            
            {/* <TabsContent value="info">
              <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Información</h2>
                <div className="space-y-4">
                  <p className="text-sm sm:text-base">
                    Use esta herramienta para verificar la asistencia al evento escaneando los códigos QR de los asistentes.
                  </p>
                  <div className="bg-primary/10 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">Instrucciones:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base">
                      <li>Seleccione la pestaña "Escáner QR"</li>
                      <li>Haga clic en "Iniciar Escáner" y permita el acceso a la cámara</li>
                      <li>Apunte la cámara al código QR del asistente</li>
                      <li>La información del asistente aparecerá automáticamente</li>
                      <li>Verifique los datos y confirme la asistencia haciendo clic en el botón correspondiente</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent> */}
          </Tabs>
        </div>
      </div>
    
    </div>
  );
}