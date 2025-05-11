"use client";

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
import type { MedicalEntry } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const medicalEntrySchema = z.object({
  date: z.date({ required_error: "La fecha es requerida." }),
  notes: z.string().min(10, { message: 'Las notas deben tener al menos 10 caracteres.' }),
});

type MedicalEntryFormValues = z.infer<typeof medicalEntrySchema>;

interface MedicalEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MedicalEntry, 'id' | 'patientId'>) => void;
  patientName: string;
}

export default function MedicalEntryFormModal({ isOpen, onClose, onSubmit, patientName }: MedicalEntryFormModalProps) {
  const form = useForm<MedicalEntryFormValues>({
    resolver: zodResolver(medicalEntrySchema),
    defaultValues: {
      date: new Date(),
      notes: '',
    },
  });

  const handleSubmit = (data: MedicalEntryFormValues) => {
    onSubmit({
      date: format(data.date, "yyyy-MM-dd"), // Store date as ISO string
      notes: data.notes,
    });
    toast({ title: "Entrada Médica Guardada", description: `Nueva entrada registrada para ${patientName}.` });
    form.reset({ date: new Date(), notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset({ date: new Date(), notes: '' }); onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Entrada Médica para {patientName}</DialogTitle>
          <DialogDescription>
            Añade una nueva nota al historial médico del paciente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de la Entrada</FormLabel>
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
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Médicas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la consulta, diagnóstico, tratamiento, etc."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => {form.reset({ date: new Date(), notes: ''}); onClose();}}>
                    <X size={18} className="mr-2"/> Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save size={18} className="mr-2"/> Guardar Entrada
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
