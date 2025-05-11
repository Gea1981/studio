'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/stat-card';
import { getStoredPatients, getStoredAppointments } from '@/lib/mock-data';
import type { Patient, Appointment } from '@/types';
import { format, isToday, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import { Users, CalendarCheck, CalendarClock, ListChecks, BarChart3, UserPlus, CalendarPlus, Zap } from 'lucide-react';

function ResumenPageContent() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Derived stats
  const [totalPatients, setTotalPatients] = useState(0);
  const [appointmentsTodayCount, setAppointmentsTodayCount] = useState(0);
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0);
  const [todaysAppointmentsList, setTodaysAppointmentsList] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadedPatients = getStoredPatients();
    const loadedAppointments = getStoredAppointments();
    setPatients(loadedPatients);
    setAppointments(loadedAppointments);

    // Calculate stats
    setTotalPatients(loadedPatients.length);

    const today = new Date();
    const startOfToday = startOfDay(today);
    
    const todayApps = loadedAppointments.filter(app => app.date && isToday(app.date));
    setAppointmentsTodayCount(todayApps.length);
    setTodaysAppointmentsList(
      todayApps
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5) // Limit to 5 for the list
    );

    const nextSevenDaysEnd = endOfDay(addDays(today, 6)); // today + 6 more days = 7 days
    const upcomingApps = loadedAppointments.filter(app => 
      app.date && isWithinInterval(app.date, { start: startOfToday, end: nextSevenDaysEnd }) && app.status === 'programada'
    );
    setUpcomingAppointmentsCount(upcomingApps.length);

  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total de Pacientes"
          value={totalPatients}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          description="Pacientes registrados en el sistema"
        />
        <StatCard 
          title="Citas para Hoy"
          value={appointmentsTodayCount}
          icon={<CalendarCheck className="h-5 w-5 text-muted-foreground" />}
          description={`${format(new Date(), "eeee, d 'de' MMMM", { locale: es })}`}
        />
        <StatCard 
          title="Próximas Citas (7 días)"
          value={upcomingAppointmentsCount}
          icon={<CalendarClock className="h-5 w-5 text-muted-foreground" />}
          description="Citas programadas esta semana"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              Citas Programadas para Hoy
            </CardTitle>
            <CardDescription>
              Resumen de las citas para {format(new Date(), "PPP", { locale: es })}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysAppointmentsList.length > 0 ? (
              <ScrollArea className="h-[280px] pr-3">
                <ul className="space-y-3">
                  {todaysAppointmentsList.map(app => (
                    <li key={app.id} className="rounded-md border p-3 bg-card hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{app.patientName || 'Paciente Desconocido'}</p>
                        <p className="text-xs text-muted-foreground">{app.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">{format(app.date, "HH:mm 'hrs'", { locale: es })}</p>
                        <Badge variant={app.status === 'programada' ? 'default' : app.status === 'completada' ? 'secondary' : 'destructive'} className="text-xs mt-1 whitespace-nowrap">
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-center py-10 text-muted-foreground h-[280px] flex flex-col justify-center items-center">
                <CalendarCheck size={40} className="mx-auto mb-3 opacity-50" />
                <p>No hay citas programadas para hoy.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Análisis y Estadísticas
            </CardTitle>
            <CardDescription>Visualizaciones y métricas clave.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
            <BarChart3 size={48} className="text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">
              Gráficos y más estadísticas estarán disponibles aquí próximamente.
            </p>
            <Button variant="outline" className="mt-4" disabled>Ver Reportes Completos</Button>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Acciones Rápidas
            </CardTitle>
             <CardDescription>Accesos directos a funciones comunes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/pacientes?tab=form')}>
              <UserPlus className="mr-3 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Registrar Paciente</p>
                <p className="text-xs text-muted-foreground">Añadir un nuevo paciente al sistema.</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/calendario')}>
              <CalendarPlus className="mr-3 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Agendar Cita</p>
                <p className="text-xs text-muted-foreground">Programar una nueva cita.</p>
              </div>
            </Button>
             <Button variant="outline" className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/pacientes')}>
              <Users className="mr-3 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Ver Pacientes</p>
                <p className="text-xs text-muted-foreground">Consultar la lista de pacientes.</p>
              </div>
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}


export default function ResumenPageContainer() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
        <Spinner size="lg"/>
        <p className="mt-4 text-muted-foreground">Cargando resumen...</p>
      </div>
    }>
      <ResumenPageContent />
    </Suspense>
  );
}
