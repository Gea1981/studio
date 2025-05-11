"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Patient, MedicalEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, FileText, UserCircle, CalendarIcon as LucideCalendarIcon, Phone, Mail, ShieldCheck, Droplets } from 'lucide-react';
import MedicalEntryFormModal from '@/components/historiales/medical-entry-form-modal';
import Spinner from '@/components/ui/spinner';
import { getStoredPatients, getStoredMedicalHistory, saveStoredMedicalHistory, getNextMedicalEntryId } from '@/lib/mock-data';

function HistorialesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(searchParams.get('patientId') || undefined);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setPatients(getStoredPatients());
    setMedicalHistory(getStoredMedicalHistory());

    const patientIdFromUrl = searchParams.get('patientId');
    if (patientIdFromUrl && !selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, []); // Load once on mount

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
    .filter(entry => entry.patientId === selectedPatientId)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const handleAddMedicalEntry = (entryData: Omit<MedicalEntry, 'id' | 'patientId'>) => {
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
  };

  const handleRegisterNewAppointment = () => {
    if (!selectedPatient) return;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    router.push(`/dashboard/calendario?newAppointmentForPatientId=${selectedPatient.id}&newAppointmentDate=${today}`);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
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
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {`${patient.firstName} ${patient.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPatient ? (
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCircle size={28} className="text-primary"/>
                Historial de {selectedPatient.firstName} {selectedPatient.lastName}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-2 space-x-4 flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center"><LucideCalendarIcon size={14} className="mr-1.5"/> Edad: {selectedPatient.age}</span>
                <span className="inline-flex items-center"><UserCircle size={14} className="mr-1.5"/> Sexo: <Badge variant="outline" className="capitalize ml-1">{selectedPatient.gender}</Badge></span>
                <span className="inline-flex items-center"><ShieldCheck size={14} className="mr-1.5"/> DNI: {selectedPatient.dni}</span>
                <span className="inline-flex items-center"><Droplets size={14} className="mr-1.5"/> Sangre: <Badge variant="secondary" className="ml-1">{selectedPatient.bloodType}</Badge></span>
              </div>
               <div className="text-sm text-muted-foreground mt-1 space-x-4 flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center"><Mail size={14} className="mr-1.5"/> {selectedPatient.email}</span>
                <span className="inline-flex items-center"><Phone size={14} className="mr-1.5"/> {selectedPatient.phone}</span>
                 {selectedPatient.secondaryContact && <span className="inline-flex items-center"><Phone size={14} className="mr-1.5"/> {selectedPatient.secondaryContact} (Sec)</span>}
              </div>
              {selectedPatient.socialWork && <p className="text-xs text-muted-foreground mt-1">Obra Social: {selectedPatient.socialWork}</p>}
              {selectedPatient.chronicDiseases && <p className="text-xs text-muted-foreground mt-1">Enf. Crónicas: {selectedPatient.chronicDiseases}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={() => setIsModalOpen(true)} variant="outline" className="w-full sm:w-auto">
                    <PlusCircle size={18} className="mr-2" /> Nueva Entrada Médica
                </Button>
                <Button onClick={handleRegisterNewAppointment} className="w-full sm:w-auto">
                    <PlusCircle size={18} className="mr-2" /> Registrar Nueva Cita
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {patientMedicalEntries.length > 0 ? (
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-4">
                  {patientMedicalEntries.map(entry => (
                    <div key={entry.id} className="p-4 rounded-md border bg-card hover:shadow-md transition-shadow">
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
              <div className="text-center py-10 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-2" />
                <p>No hay entradas en el historial médico para este paciente.</p>
                <p className="text-xs mt-1">Puedes añadir una nueva entrada o cita usando los botones de arriba.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
         selectedPatientId && !selectedPatient && patients.length > 0 ? ( // Only show "not found" if patients are loaded
            <Card className="shadow-lg rounded-xl">
                 <CardContent className="py-10 text-center text-muted-foreground">
                    <UserCircle size={48} className="mx-auto mb-2 text-destructive" />
                    <p>Paciente no encontrado.</p>
                    <p className="text-xs mt-1">El ID del paciente en la URL no es válido o el paciente no existe.</p>
                </CardContent>
            </Card>
         ) : (
            <Card className="shadow-lg rounded-xl">
                 <CardContent className="py-10 text-center text-muted-foreground">
                    <UserCircle size={48} className="mx-auto mb-2" />
                    <p>Selecciona un paciente para ver su historial.</p>
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
        <div className="flex flex-col items-center justify-center h-64">
            <Spinner size="lg"/>
            <p className="mt-2 text-muted-foreground">Cargando historiales...</p>
        </div>
    }>
      <HistorialesContent />
    </Suspense>
  );
}
