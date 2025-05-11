
"use client";

import { useState } from 'react';
import PatientForm from '@/components/pacientes/patient-form';
import PatientList from '@/components/pacientes/patient-list';
import type { Patient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, ListChecks } from 'lucide-react';
import { initialPatients as mockInitialPatients, getNextPatientId } from '@/lib/mock-data';


export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>(mockInitialPatients);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  const handleAddPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient = { ...patient, id: getNextPatientId() };
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
