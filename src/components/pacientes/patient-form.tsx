
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import type { Patient, BloodType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Save, XCircle, X as CloseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'];

const patientSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  dni: z.string().regex(/^\d{7,8}$/, { message: 'El DNI debe tener entre 7 y 8 dígitos numéricos.' }),
  age: z.coerce.number().int().positive({ message: 'La edad debe ser un número positivo.' }).max(120),
  gender: z.enum(['masculino', 'femenino', 'otro'], { required_error: 'Por favor selecciona un género.' }),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'], { required_error: 'Selecciona un tipo de sangre.' }),
  address: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres.' }),
  phone: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: 'Número de teléfono inválido.' }),
  secondaryContact: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: 'Número de contacto secundario inválido.' }).optional().or(z.literal('')),
  email: z.string().email({ message: 'Email inválido.' }),
  socialWork: z.string().optional(),
  chronicDiseases: z.array(z.string()).optional(), // Updated to array of strings
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSubmitPatient: (data: Patient | Omit<Patient, 'id'>) => void;
  editingPatient?: Patient | null;
  onCancelEdit?: () => void;
}

export default function PatientForm({ onSubmitPatient, editingPatient, onCancelEdit }: PatientFormProps) {
  
  const defaultFormValues = useCallback(() => ({
    firstName: '',
    lastName: '',
    dni: '',
    age: '' as any,
    gender: undefined,
    bloodType: 'Desconocido' as BloodType,
    address: '',
    phone: '',
    secondaryContact: '',
    email: '',
    socialWork: '',
    chronicDiseases: [] as string[], // Initialize as empty array
  }), []);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: editingPatient ? {
      ...editingPatient,
      age: editingPatient.age, 
      socialWork: editingPatient.socialWork || '',
      chronicDiseases: editingPatient.chronicDiseases || [], // Ensure it's an array
      secondaryContact: editingPatient.secondaryContact || '',
    } : defaultFormValues(),
  });

  const [currentDiseaseInput, setCurrentDiseaseInput] = useState('');

  useEffect(() => {
    if (editingPatient) {
      form.reset({
        ...editingPatient,
        age: editingPatient.age, 
        socialWork: editingPatient.socialWork || '',
        chronicDiseases: editingPatient.chronicDiseases || [], // Ensure array
        secondaryContact: editingPatient.secondaryContact || '',
      });
    } else {
      form.reset(defaultFormValues());
    }
  }, [editingPatient, form, defaultFormValues]);

  const handleAddDisease = (disease: string) => {
    if (disease && !form.getValues('chronicDiseases')?.includes(disease)) {
      const currentDiseases = form.getValues('chronicDiseases') || [];
      form.setValue('chronicDiseases', [...currentDiseases, disease], { shouldValidate: true });
    }
  };

  const handleRemoveDisease = (diseaseToRemove: string) => {
    const currentDiseases = form.getValues('chronicDiseases') || [];
    form.setValue('chronicDiseases', currentDiseases.filter(d => d !== diseaseToRemove), { shouldValidate: true });
  };

  const handleDiseaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setCurrentDiseaseInput(e.target.value);
  };

  const handleDiseaseInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newDisease = currentDiseaseInput.trim();
      if (newDisease) {
        handleAddDisease(newDisease);
        setCurrentDiseaseInput(''); // Clear input after adding
      }
    }
  };

  const handleSubmit = (data: PatientFormValues) => {
    // Ensure final data structure is correct
    const patientData = {
      ...data,
      age: Number(data.age), 
      socialWork: data.socialWork?.trim() || undefined, 
      chronicDiseases: data.chronicDiseases && data.chronicDiseases.length > 0 ? data.chronicDiseases : undefined, // Store as array or undefined
      secondaryContact: data.secondaryContact?.trim() || undefined,
    };
  
    if (editingPatient) {
      onSubmitPatient({ ...editingPatient, ...patientData });
      toast({ title: "Paciente Actualizado", description: `${data.firstName} ${data.lastName} ha sido actualizado.` });
    } else {
      onSubmitPatient(patientData); // Pass Omit<Patient, 'id'>
      toast({ title: "Paciente Registrado", description: `${data.firstName} ${data.lastName} ha sido registrado exitosamente.` });
      form.reset(defaultFormValues()); // Reset to new patient defaults only when adding
    }
     setCurrentDiseaseInput(''); // Clear temporary input on submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* ... other fields (firstName, lastName, dni, age, gender, bloodType, address, phone, email) ... */}
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
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 30" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sangre</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de sangre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
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
                <Textarea placeholder="Ej: Calle Falsa 123, Ciudad" className="min-h-[60px]" {...field} />
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
                <FormLabel>Teléfono Principal</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: +52 55 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="secondaryContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono Secundario (Opcional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: +52 55 8765 4321" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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

        <FormField
            control={form.control}
            name="socialWork"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Obra Social (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: OSDE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        {/* Chronic Diseases Input */}
        <FormField
          control={form.control}
          name="chronicDiseases"
          render={({ field }) => ( // field contains { value: string[], onChange: (value: string[]) => void, ... }
            <FormItem>
              <FormLabel>Enfermedades Crónicas (Opcional)</FormLabel>
              <FormControl>
                 {/* Wrap content in a div to receive the 'id' prop */}
                 <div>
                   <Input
                    placeholder="Escribe una enfermedad y presiona Enter..."
                    value={currentDiseaseInput}
                    onChange={handleDiseaseInputChange}
                    onKeyDown={handleDiseaseInputKeyDown}
                   />
                   <div className="mt-2 flex flex-wrap gap-2">
                     {field.value?.map((disease) => (
                       <Badge key={disease} variant="secondary" className="flex items-center gap-1 pr-1">
                         {disease}
                         <button
                           type="button"
                           onClick={() => handleRemoveDisease(disease)}
                           className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                           aria-label={`Eliminar ${disease}`}
                         >
                           <CloseIcon size={14} />
                         </button>
                       </Badge>
                     ))}
                   </div>
                 </div>
              </FormControl>
              <FormDescription>
                Añade enfermedades separadas por Enter o coma.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
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

