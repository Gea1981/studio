"use client";

import { useState, useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Appointment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale

// Mock appointments data
const mockAppointments: Appointment[] = [
  { id: '1', patientId: 'p1', patientName: 'Ana Pérez', date: new Date(2024, 6, 18, 10, 0), reason: 'Consulta General', status: 'programada' },
  { id: '2', patientId: 'p2', patientName: 'Luis García', date: new Date(2024, 6, 18, 11, 30), reason: 'Revisión Dental', status: 'programada' },
  { id: '3', patientId: 'p3', patientName: 'María Rodriguez', date: new Date(2024, 6, 20, 9, 0), reason: 'Vacunación', status: 'completada' },
  { id: '4', patientId: 'p1', patientName: 'Ana Pérez', date: new Date(2024, 6, 25, 14, 0), reason: 'Seguimiento', status: 'programada' },
];


export default function CalendarioPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return mockAppointments
      .filter(app => format(app.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate]);

  return (
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
            locale={es} // Use Spanish locale
            modifiers={{ 
              appointments: mockAppointments.map(app => app.date) 
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
  );
}
