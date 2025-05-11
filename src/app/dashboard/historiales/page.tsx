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
import { PlusCircle, FileText, UserCircle, CalendarIcon, Phone, Mail } from 'lucide-react';
import MedicalEntryFormModal from '@/components/historiales/medical-entry-form-modal';
import Spinner from '@/components/ui/spinner';

// Mock data - In a real app, this would come from a database/API
const mockPatients: Patient[] = [
  { id: '1', firstName: 'Ana', lastName: 'Pérez', age: 34, gender: 'femenino', address: 'Calle Falsa 123', phone: '555-1234', email: 'ana.perez@example.com' },
  { id: '2', firstName: 'Luis', lastName: 'García', age: 45, gender: 'masculino', address: 'Avenida Siempreviva 742', phone: '555-5678', email: 'luis.garcia@example.com' },
  { id: '3', firstName: 'María', lastName: 'Rodriguez', age: 28, gender: 'femenino', address: 'Pasaje Seguro 45', phone: '555-8765', email: 'maria.rodriguez@example.com' },
];

let nextMedicalEntryId = 4;
const mockMedicalHistory: MedicalEntry[] = [
  { id: '1', patientId: '1', date: '2023-01-15', notes: 'Consulta general. Paciente refiere dolor de cabeza ocasional. Se recomienda descanso y hidratación.' },
  { id: '2', patientId: '1', date: '2023-06-20', notes: 'Chequeo anual. Todo en orden. Próxima revisión en un año.' },
  { id: '3', patientId: '2', date: '2023-03-10', notes: 'Revisión dental. Limpieza realizada. Se detecta caries leve en molar superior derecho.' },
];

function HistorialesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(searchParams.get('patientId') || undefined);
  const [patients, setPatients] = useState<Patient[]>(mockPatients); // In real app, fetch this
  const [medicalHistory, setMedicalHistory] = useState<MedicalEntry[]>(mockMedicalHistory); // In real app, fetch this
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Sync selectedPatientId with URL search param
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
      id: String(nextMedicalEntryId++),
      patientId: selectedPatientId,
    };
    setMedicalHistory(prev => [newEntry, ...prev]);
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
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCircle size={28} className="text-primary"/>
                Historial de {selectedPatient.firstName} {selectedPatient.lastName}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-2 space-x-4">
                <span className="inline-flex items-center"><CalendarIcon size={14} className="mr-1.5"/> Edad: {selectedPatient.age}</span>
                <span className="inline-flex items-center"><UserCircle size={14} className="mr-1.5"/> Sexo: <Badge variant="outline" className="capitalize ml-1">{selectedPatient.gender}</Badge></span>
              </div>
               <div className="text-sm text-muted-foreground mt-1 space-x-4">
                <span className="inline-flex items-center"><Mail size={14} className="mr-1.5"/> {selectedPatient.email}</span>
                <span className="inline-flex items-center"><Phone size={14} className="mr-1.5"/> {selectedPatient.phone}</span>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={18} className="mr-2" /> Nueva Entrada
            </Button>
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
                        {/* Add edit/delete for entries in future */}
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
                <p className="text-xs mt-1">Puedes añadir una nueva entrada usando el botón de arriba.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
         selectedPatientId && !selectedPatient ? (
            <Card className="shadow-lg rounded-xl">
                 <CardContent className="py-10 text-center text-muted-foreground">
                    <UserCircle size={48} className="mx-auto mb-2 text-destructive" />
                    <p>Paciente no encontrado.</p>
                    <p className="text-xs mt-1">El ID del paciente en la URL no es válido.</p>
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
  // Suspense boundary for useSearchParams
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
