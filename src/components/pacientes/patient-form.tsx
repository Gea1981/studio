"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Patient } from '@/types';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Save, XCircle } from 'lucide-react';

const patientSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  age: z.coerce.number().int().positive({ message: 'La edad debe ser un número positivo.' }).min(0).max(120),
  gender: z.enum(['masculino', 'femenino', 'otro'], { required_error: 'Por favor selecciona un género.' }),
  address: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres.' }),
  phone: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: 'Número de teléfono inválido.' }),
  email: z.string().email({ message: 'Email inválido.' }),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSubmitPatient: (data: Patient | Omit<Patient, 'id'>) => void;
  editingPatient?: Patient | null;
  onCancelEdit?: () => void;
}

export default function PatientForm({ onSubmitPatient, editingPatient, onCancelEdit }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: editingPatient || {
      firstName: '',
      lastName: '',
      age: undefined, // Changed from 0 to undefined for better placeholder behavior
      gender: undefined,
      address: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (editingPatient) {
      form.reset(editingPatient);
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        age: undefined,
        gender: undefined,
        address: '',
        phone: '',
        email: '',
      });
    }
  }, [editingPatient, form]);

  const handleSubmit = (data: PatientFormValues) => {
    if (editingPatient) {
      onSubmitPatient({ ...editingPatient, ...data });
      toast({ title: "Paciente Actualizado", description: `${data.firstName} ${data.lastName} ha sido actualizado.` });
    } else {
      onSubmitPatient(data);
      toast({ title: "Paciente Registrado", description: `${data.firstName} ${data.lastName} ha sido registrado exitosamente.` });
    }
    if (!editingPatient) { // Only reset if it's a new patient form
        form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 30" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Calle Falsa 123, Ciudad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: +52 55 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Ej: juan.perez@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {editingPatient && onCancelEdit && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              <XCircle size={18} className="mr-2"/>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {editingPatient ? <Save size={18} className="mr-2"/> : <UserPlus size={18} className="mr-2"/>}
            {editingPatient ? 'Guardar Cambios' : 'Registrar Paciente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
