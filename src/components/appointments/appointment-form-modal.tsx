
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Appointment, Patient } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Save, X, CalendarIcon as LucideCalendarIcon, Clock } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const appointmentSchema = z.object({
  patientId: z.string({ required_error: "El paciente es requerido." }),
  date: z.date({ required_error: "La fecha es requerida." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  reason: z.string().min(5, { message: 'El motivo debe tener al menos 5 caracteres.' }),
  status: z.enum(['programada', 'completada', 'cancelada'], { required_error: 'El estado es requerido.' }),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormValues, editingId?: string) => void;
  patients: Patient[];
  initialPatientId?: string;
  initialDate?: Date;
  editingAppointment?: Appointment | null;
}

export default function AppointmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  patients,
  initialPatientId,
  initialDate,
  editingAppointment,
}: AppointmentFormModalProps) {
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    // Default values will be set by useEffect
  });

  useEffect(() => {
    if (isOpen) {
      if (editingAppointment) {
        form.reset({
          patientId: editingAppointment.patientId,
          date: editingAppointment.date, // This is a Date object
          time: format(editingAppointment.date, "HH:mm"), // Extract time
          reason: editingAppointment.reason,
          status: editingAppointment.status,
        });
      } else {
        form.reset({
          patientId: initialPatientId || undefined,
          date: initialDate || new Date(),
          time: initialDate ? format(initialDate, "HH:mm") : format(new Date(), "HH:mm"),
          reason: '',
          status: 'programada',
        });
      }
    }
  }, [isOpen, editingAppointment, initialPatientId, initialDate, form]);

  const handleSubmit = (data: AppointmentFormValues) => {
    onSubmit(data, editingAppointment?.id);
    toast({
      title: editingAppointment ? "Cita Actualizada" : "Cita Guardada",
      description: `La cita para ${patients.find(p => p.id === data.patientId)?.firstName || 'el paciente'} ha sido ${editingAppointment ? 'actualizada' : 'registrada'}.`
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Registrar Nueva Cita'}</DialogTitle>
          <DialogDescription>
            {editingAppointment ? 'Modifica los detalles de la cita.' : 'Completa los detalles de la nueva cita.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingAppointment}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paciente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {`${patient.firstName} ${patient.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <LucideCalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="time" {...field} className="pr-8" />
                      </FormControl>
                      <Clock className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la Cita</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Consulta general, revisión, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                    <X size={18} className="mr-2"/> Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save size={18} className="mr-2"/> 
                {editingAppointment ? 'Guardar Cambios' : 'Guardar Cita'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
