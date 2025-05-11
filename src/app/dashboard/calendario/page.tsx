"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Appointment, Patient } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Users } from 'lucide-react';
import AppointmentFormModal from '@/components/appointments/appointment-form-modal';
import { getStoredAppointments, saveStoredAppointments, getStoredPatients, getNextAppointmentId } from '@/lib/mock-data';
import Spinner from '@/components/ui/spinner';

function CalendarioPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [targetPatientIdForModal, setTargetPatientIdForModal] = useState<string | undefined>(undefined);
  const [targetDateForModal, setTargetDateForModal] = useState<Date | undefined>(new Date());

  useEffect(() => {
    setAppointments(getStoredAppointments());
    setPatients(getStoredPatients());
  }, []);

  useEffect(() => {
    const newAppPatientId = searchParams.get('newAppointmentForPatientId');
    const newAppDateStr = searchParams.get('newAppointmentDate');

    if (newAppPatientId) {
      setTargetPatientIdForModal(newAppPatientId);
      if (newAppDateStr) {
        setTargetDateForModal(parseISO(newAppDateStr));
      } else {
        setTargetDateForModal(new Date());
      }
      setIsAppointmentModalOpen(true);
      // Clean query params
      router.replace('/dashboard/calendario', { scroll: false });
    }
  }, [searchParams, router]);


  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter(app => format(app.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate, appointments]);

  const handleAddAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'patientName'>) => {
    const patient = patients.find(p => p.id === newAppointmentData.patientId);
    const newAppointment: Appointment = {
      ...newAppointmentData,
      id: getNextAppointmentId(),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido',
    };
    setAppointments(prev => {
      const updatedAppointments = [...prev, newAppointment].sort((a,b) => a.date.getTime() - b.date.getTime());
      saveStoredAppointments(updatedAppointments);
      return updatedAppointments;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div /> {/* Placeholder for potential title alignment */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="shadow">
              <PlusCircle className="mr-2 h-5 w-5" />
              Registrar Nueva Cita
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Para Paciente Existente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[200px]">
              {patients.map((patient) => (
                <DropdownMenuItem
                  key={patient.id}
                  onSelect={() => {
                    setTargetPatientIdForModal(patient.id);
                    setTargetDateForModal(selectedDate || new Date());
                    setIsAppointmentModalOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  {patient.firstName} {patient.lastName}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setTargetPatientIdForModal(undefined); // No specific patient, could be new or general
                setTargetDateForModal(selectedDate || new Date());
                setIsAppointmentModalOpen(true);
              }}
              className="cursor-pointer"
            >
              <Users className="mr-2 h-4 w-4" />
              Cita General / Nuevo Paciente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Calendario de Citas</CardTitle>
            <CardDescription>Selecciona una fecha para ver las citas programadas.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border bg-card p-0"
              locale={es}
              modifiers={{
                appointments: appointments.map(app => app.date)
              }}
              modifiersStyles={{
                appointments: {
                  color: 'hsl(var(--primary-foreground))',
                  backgroundColor: 'hsl(var(--primary))',
                }
              }}
              footer={
                selectedDate ? (
                  <p className="text-sm text-center p-2 text-muted-foreground">
                    Fecha seleccionada: {format(selectedDate, "PPP", { locale: es })}.
                  </p>
                ) : (
                  <p className="text-sm text-center p-2 text-muted-foreground">
                    Por favor, selecciona un día.
                  </p>
                )
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Citas del Día</CardTitle>
            <CardDescription>
              {selectedDate ? format(selectedDate, "eeee, d 'de' MMMM", { locale: es }) : 'Ninguna fecha seleccionada'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {appointmentsForSelectedDate.length > 0 ? (
                <ul className="space-y-3">
                  {appointmentsForSelectedDate.map((app) => (
                    <li key={app.id} className="rounded-md border p-3 bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{app.patientName || 'Paciente Desconocido'}</p>
                          <p className="text-xs text-muted-foreground">{app.reason}</p>
                        </div>
                        <Badge variant={app.status === 'programada' ? 'default' : app.status === 'completada' ? 'secondary' : 'destructive'} className="text-xs whitespace-nowrap">
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary mt-1">{format(app.date, "HH:mm 'hrs'", { locale: es })}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No hay citas para esta fecha.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSubmit={handleAddAppointment}
        patients={patients}
        initialPatientId={targetPatientIdForModal}
        initialDate={targetDateForModal}
      />
    </div>
  );
}

export default function CalendarioPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg"/>
        <p className="mt-2 text-muted-foreground">Cargando calendario...</p>
      </div>
    }>
      <CalendarioPageContent />
    </Suspense>
  );
}