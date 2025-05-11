"use client";

import { useState } from 'react';
import PatientForm from '@/components/pacientes/patient-form';
import PatientList from '@/components/pacientes/patient-list';
import type { Patient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, ListChecks } from 'lucide-react';

// Mock patient data store
let nextId = 4;
const initialPatients: Patient[] = [
  { id: '1', firstName: 'Ana', lastName: 'Pérez', age: 34, gender: 'femenino', address: 'Calle Falsa 123', phone: '555-1234', email: 'ana.perez@example.com' },
  { id: '2', firstName: 'Luis', lastName: 'García', age: 45, gender: 'masculino', address: 'Avenida Siempreviva 742', phone: '555-5678', email: 'luis.garcia@example.com' },
  { id: '3', firstName: 'María', lastName: 'Rodriguez', age: 28, gender: 'femenino', address: 'Pasaje Seguro 45', phone: '555-8765', email: 'maria.rodriguez@example.com' },
];

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  const handleAddPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient = { ...patient, id: String(nextId++) };
    setPatients(prev => [newPatient, ...prev]);
    setActiveTab("list"); // Switch to list after adding
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setEditingPatient(null);
    setActiveTab("list"); // Switch to list after editing
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveTab("form");
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setActiveTab("list");
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-96 mb-6">
        <TabsTrigger value="list" className="gap-2">
            <ListChecks size={18}/> Lista de Pacientes
        </TabsTrigger>
        <TabsTrigger value="form" className="gap-2">
            <UserPlus size={18}/> {editingPatient ? "Editar Paciente" : "Registrar Paciente"}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>Visualiza y administra los pacientes registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientList patients={patients} onEdit={handleEditPatient} onDelete={handleDeletePatient} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="form">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>{editingPatient ? "Editar Información del Paciente" : "Registrar Nuevo Paciente"}</CardTitle>
            <CardDescription>
              {editingPatient ? "Actualiza los datos del paciente." : "Completa el formulario para añadir un nuevo paciente."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientForm 
                onSubmitPatient={editingPatient ? handleUpdatePatient : handleAddPatient} 
                editingPatient={editingPatient}
                onCancelEdit={editingPatient ? handleCancelEdit : undefined}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
