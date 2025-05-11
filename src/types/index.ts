export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Desconocido';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'masculino' | 'femenino' | 'otro';
  address: string;
  phone: string;
  email: string;
  dni: string; 
  socialWork?: string; 
  chronicDiseases?: string; 
  bloodType: BloodType; 
  secondaryContact?: string; 
}

export interface MedicalEntry {
  id: string;
  patientId: string;
  date: string; // ISO date string e.g. "2024-07-15"
  notes: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; 
  date: Date; // Full JS Date object
  reason: string;
  status: 'programada' | 'completada' | 'cancelada';
}

export interface UserCredentials {
  id: string;
  username: string;
  password_plaintext: string; // Storing plaintext for mock purposes. In production, use a hash.
  // role?: 'admin' | 'user'; // Optional role for future enhancements
}
