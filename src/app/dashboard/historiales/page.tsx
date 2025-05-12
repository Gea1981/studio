
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Patient, MedicalEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, FileText, UserCircle, CalendarIcon as LucideCalendarIcon, Phone, Mail, ShieldCheck, Droplets, Printer, AlertTriangle } from 'lucide-react';
import MedicalEntryFormModal from '@/components/historiales/medical-entry-form-modal';
import Spinner from '@/components/ui/spinner';
import { getStoredPatients, getStoredMedicalHistory, saveStoredMedicalHistory, getNextMedicalEntryId } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function HistorialesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(searchParams.get('patientId') || undefined);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalEntry[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Simulate async loading for localStorage to maintain UI consistency
    await new Promise(resolve => setTimeout(resolve, 100)); 
    try {
      const fetchedPatients = getStoredPatients();
      setPatients(fetchedPatients.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      }));
      
      const fetchedHistory = getStoredMedicalHistory();
      setMedicalHistory(fetchedHistory.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    } catch (e: any) {
      console.error("Failed to fetch data from localStorage:", e.message);
      const errorMessage = "No se pudieron cargar los datos. Intente más tarde.";
      setError(errorMessage);
      toast({ title: "Error al Cargar Datos", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const patientIdFromUrl = searchParams.get('patientId');
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [searchParams, selectedPatientId]);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    router.push(`/dashboard/historiales?patientId=${patientId}`, { scroll: false });
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const patientMedicalEntries = medicalHistory
    .filter(entry => entry.patientId === selectedPatientId);
    // Already sorted when fetched/updated

  const handleAddMedicalEntry = async (entryData: Omit<MedicalEntry, 'id' | 'patientId'>) => {
    if (!selectedPatientId) return;
    
    const newEntry: MedicalEntry = {
      ...entryData,
      id: getNextMedicalEntryId(),
      patientId: selectedPatientId,
    };

    setMedicalHistory(prev => {
      const updatedHistory = [newEntry, ...prev].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      saveStoredMedicalHistory(updatedHistory);
      return updatedHistory;
    });
    
    toast({ title: "Entrada Médica Guardada", description: `Nueva entrada registrada para ${selectedPatient?.firstName} ${selectedPatient?.lastName}.` });
  };

  const handleRegisterNewAppointment = () => {
    if (!selectedPatient) return;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    router.push(`/dashboard/calendario?newAppointmentForPatientId=${selectedPatient.id}&newAppointmentDate=${today}`);
  };

  const handlePrintHistory = () => {
    window.print();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 print-hide-content">
        <Spinner size="lg"/>
        <p className="mt-2 text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg rounded-xl print-hide-content">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle size={24} /> Error al Cargar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-destructive-foreground bg-destructive/10 rounded-b-xl">
          <p className="whitespace-pre-wrap">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive/20">
            Reintentar Carga
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl print-hide-content">
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
          <CardDescription>Elige un paciente para ver su historial médico.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handlePatientSelect} value={selectedPatientId}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecciona un paciente..." />
            </SelectTrigger>
            <SelectContent>
              {patients.length > 0 ? patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {`${patient.firstName} ${patient.lastName}`}
                </SelectItem>
              )) : <div className="p-4 text-sm text-muted-foreground">No hay pacientes.</div>}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPatient ? (
        <Card className={cn("shadow-lg rounded-xl", selectedPatient ? "historiales-print-area" : "print-hide-content")}>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCircle size={28} className="text-primary" />
                Historial de {selectedPatient.firstName} {selectedPatient.lastName}
              </CardTitle>
              <div className="patient-details-print mt-2 space-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center mr-4"><LucideCalendarIcon size={14} className="mr-1.5 text-primary"/> Edad: {selectedPatient.age}</span>
                <span className="inline-flex items-center mr-4"><UserCircle size={14} className="mr-1.5 text-primary"/> Sexo: <Badge variant="outline" className="capitalize ml-1">{selectedPatient.gender}</Badge></span>
                <span className="inline-flex items-center mr-4"><ShieldCheck size={14} className="mr-1.5 text-primary"/> DNI: {selectedPatient.dni}</span>
                <span className="inline-flex items-center mr-4"><Droplets size={14} className="mr-1.5 text-primary"/> Sangre: <Badge variant="secondary" className="ml-1">{selectedPatient.bloodType}</Badge></span>
                <br className="sm:hidden"/>
                <span className="inline-flex items-center mr-4"><Mail size={14} className="mr-1.5 text-primary"/> {selectedPatient.email}</span>
                <span className="inline-flex items-center"><Phone size={14} className="mr-1.5 text-primary"/> {selectedPatient.phone}</span>
                {selectedPatient.secondaryContact && <span className="inline-flex items-center ml-4"><Phone size={14} className="mr-1.5 text-primary"/> {selectedPatient.secondaryContact} (Sec)</span>}
                {selectedPatient.socialWork && <p className="text-xs text-muted-foreground mt-1">Obra Social: {selectedPatient.socialWork}</p>}
                {selectedPatient.chronicDiseases && <p className="text-xs text-muted-foreground">Enf. Crónicas: {selectedPatient.chronicDiseases}</p>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto print-hide-content">
                <Button onClick={() => setIsModalOpen(true)} variant="outline" className="w-full sm:w-auto shadow-sm">
                    <PlusCircle size={18} className="mr-2" /> Nueva Entrada Médica
                </Button>
                <Button onClick={handleRegisterNewAppointment} className="w-full sm:w-auto shadow-sm">
                    <PlusCircle size={18} className="mr-2" /> Registrar Nueva Cita
                </Button>
                <Button onClick={handlePrintHistory} variant="outline" className="w-full sm:w-auto shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Historial
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {patientMedicalEntries.length > 0 ? (
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-4">
                  {patientMedicalEntries.map(entry => (
                    <div key={entry.id} className="p-4 rounded-md border bg-card hover:shadow-md transition-shadow medical-entry">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-primary">
                          {format(parseISO(entry.date), "PPP", { locale: es })}
                        </h4>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-10 text-muted-foreground no-entries-message">
                <FileText size={48} className="mx-auto mb-2" />
                <p>No hay entradas en el historial médico para este paciente.</p>
                <p className="text-xs mt-1 print-hide-content">Puedes añadir una nueva entrada o cita usando los botones de arriba.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
         selectedPatientId && !selectedPatient && patients.length > 0 && !isLoading ? ( 
            <Card className="shadow-lg rounded-xl print-hide-content">
                 <CardContent className="py-10 text-center text-muted-foreground">
                    <UserCircle size={48} className="mx-auto mb-2 text-destructive" />
                    <p>Paciente no encontrado.</p>
                    <p className="text-xs mt-1">El ID del paciente en la URL no es válido o el paciente no existe.</p>
                </CardContent>
            </Card>
         ) : (
            !isLoading && // only show if not loading and no patient selected
            <Card className="shadow-lg rounded-xl print-hide-content">
                 <CardContent className="py-10 text-center text-muted-foreground">
                    <UserCircle size={48} className="mx-auto mb-2" />
                    <p>Selecciona un paciente para ver su historial.</p>
                     {patients.length === 0 && <p className="text-xs mt-1">No hay pacientes registrados en el sistema.</p>}
                </CardContent>
            </Card>
         )
      )}

      {selectedPatient && (
        <MedicalEntryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddMedicalEntry}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
        />
      )}
    </div>
  );
}

export default function HistorialesPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 print-hide-content">
            <Spinner size="lg"/>
            <p className="mt-2 text-muted-foreground">Cargando historiales...</p>
        </div>
    }>
      <HistorialesContent />
    </Suspense>
  );
}

