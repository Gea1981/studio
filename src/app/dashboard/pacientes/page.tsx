"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Added
import PatientForm from '@/components/pacientes/patient-form';
import PatientList from '@/components/pacientes/patient-list';
import type { Patient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, ListChecks } from 'lucide-react';
import { getStoredPatients, saveStoredPatients, getNextPatientId } from '@/lib/mock-data';


export default function PacientesPage() {
  const searchParams = useSearchParams(); // Added
  const initialTab = searchParams.get('tab') === 'form' ? 'form' : 'list'; // Added

  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab); // Updated

  useEffect(() => {
    setPatients(getStoredPatients());
  }, []);

  // Sync tab if query param changes after mount (optional but good UX)
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery === 'form' ? 'form' : 'list');
    }
  }, [searchParams, activeTab]);


  const handleAddPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient = { ...patient, id: getNextPatientId() };
    setPatients(prev => {
      const updatedPatients = [newPatient, ...prev];
      saveStoredPatients(updatedPatients);
      return updatedPatients;
    });
    setActiveTab("list"); // Switch to list after adding
    // Clear query param if it was used to open form (optional)
    // router.replace('/dashboard/pacientes', { scroll: false }); 
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => {
      const updatedPatients = prev.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      saveStoredPatients(updatedPatients);
      return updatedPatients;
    });
    setEditingPatient(null);
    setActiveTab("list"); // Switch to list after editing
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => {
      const updatedPatients = prev.filter(p => p.id !== patientId);
      saveStoredPatients(updatedPatients);
      return updatedPatients;
    });
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveTab("form");
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setActiveTab("list");
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // If switching away from form tab that might have been opened by query param,
    // you might want to clear the query param.
    // For simplicity, this is not implemented here, but router.replace can be used.
    if (value === 'list' && editingPatient) {
      setEditingPatient(null); // Clear editing state if switching to list
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full"> {/* Updated */}
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
