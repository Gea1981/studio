export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'masculino' | 'femenino' | 'otro';
  address: string;
  phone: string;
  email: string;
}

export interface MedicalEntry {
  id: string;
  patientId: string;
  date: string; // ISO date string e.g. "2024-07-15"
  notes: string;
  // Future fields: diagnosis, treatment, attachments, etc.
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // Denormalized for easier display
  date: Date; // Full JS Date object
  reason: string;
  status: 'programada' | 'completada' | 'cancelada';
}
