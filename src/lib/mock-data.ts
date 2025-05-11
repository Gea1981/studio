
import type { Patient, Appointment, MedicalEntry } from '@/types';

// Patients
let nextPatientIdCounter = 4;
export const initialPatients: Patient[] = [
  { id: '1', firstName: 'Ana', lastName: 'Pérez', age: 34, gender: 'femenino', address: 'Calle Falsa 123', phone: '555-1234', email: 'ana.perez@example.com' },
  { id: '2', firstName: 'Luis', lastName: 'García', age: 45, gender: 'masculino', address: 'Avenida Siempreviva 742', phone: '555-5678', email: 'luis.garcia@example.com' },
  { id: '3', firstName: 'María', lastName: 'Rodriguez', age: 28, gender: 'femenino', address: 'Pasaje Seguro 45', phone: '555-8765', email: 'maria.rodriguez@example.com' },
];
export const getNextPatientId = () => String(nextPatientIdCounter++);

// Medical Entries
let nextMedicalEntryIdCounter = 4;
export const initialMedicalHistory: MedicalEntry[] = [
  { id: '1', patientId: '1', date: '2023-01-15', notes: 'Consulta general. Paciente refiere dolor de cabeza ocasional. Se recomienda descanso y hidratación.' },
  { id: '2', patientId: '1', date: '2023-06-20', notes: 'Chequeo anual. Todo en orden. Próxima revisión en un año.' },
  { id: '3', patientId: '2', date: '2023-03-10', notes: 'Revisión dental. Limpieza realizada. Se detecta caries leve en molar superior derecho.' },
];
export const getNextMedicalEntryId = () => String(nextMedicalEntryIdCounter++);

// Appointments
let nextAppointmentIdCounter = 5; // Start after existing mock data
export const initialAppointments: Appointment[] = [
  { id: '1', patientId: 'p1', patientName: 'Ana Pérez', date: new Date(2024, 6, 18, 10, 0), reason: 'Consulta General', status: 'programada' },
  { id: '2', patientId: 'p2', patientName: 'Luis García', date: new Date(2024, 6, 18, 11, 30), reason: 'Revisión Dental', status: 'programada' },
  { id: '3', patientId: 'p3', patientName: 'María Rodriguez', date: new Date(2024, 6, 20, 9, 0), reason: 'Vacunación', status: 'completada' },
  { id: '4', patientId: 'p1', patientName: 'Ana Pérez', date: new Date(2024, 6, 25, 14, 0), reason: 'Seguimiento', status: 'programada' },
];
export const getNextAppointmentId = () => String(nextAppointmentIdCounter++);
