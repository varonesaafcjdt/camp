"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import DashboardStats from '@/components/admin/dashboard-stats';
import AttendeesTable from '@/components/admin/attendees-table';
import dynamic from 'next/dynamic';
import { RefreshProvider } from './refresh-context';
import { useRefresh } from './refresh-context';
import { RefreshCw } from 'lucide-react';
import DashboardReports from './dashboard-reports';

const PaymentsChart = dynamic(() => import('@/components/admin/payments-chart'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-slate-500">Cargando gráfico...</div>
});

interface DashboardProps {
  onLogout: () => Promise<void>;
}

function DashboardContent() {
  const { refreshAll, isRefreshing } = useRefresh();

  const handleRefresh = async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className='bg-white border-slate-200 text-slate-700 hover:text-primary hover:border-primary px-4 py-2 h-auto shadow-sm'
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar todo'}
        </Button>
      </div>
      <DashboardStats />
    </div>
  );
}

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <RefreshProvider>
      <div className="bg-try max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="bg-white border-slate-200 text-slate-700 hover:text-primary hover:border-primary flex items-center gap-2 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        
        <DashboardContent />
        
        <Tabs defaultValue="attendees" className="mt-8">
          <TabsList className="grid grid-cols-3 md:w-[600px] mb-8 bg-slate-100/80 border border-slate-200 p-1">
            <TabsTrigger 
              value="attendees"
              className="text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
            >
              Asistentes
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
            >
              Pagos y Estadísticas
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
            >
              Reportes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendees">
            <AttendeesTable />
          </TabsContent>
          
          <TabsContent value="payments">
            <PaymentsChart />
          </TabsContent>

          <TabsContent value="reports">
            <DashboardReports />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshProvider>
  );
}