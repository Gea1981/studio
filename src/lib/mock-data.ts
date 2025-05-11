import type { Patient, Appointment, MedicalEntry, BloodType } from '@/types';

// Helper function to get data from localStorage
const getFromLocalStorage = <T>(
  key: string,
  defaultValue: T,
  reviver?: (key: string, value: any) => any
): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item, reviver);
    }
    // If no item, save the default value for next time, applying reviver logic if any (though less common for default save)
    // For dates, the default value is already a Date object, so stringify will handle it.
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    // Fallback: save the default value if reading failed critically
    try {
      window.localStorage.setItem(key, JSON.stringify(defaultValue));
    } catch (saveError) {
      console.warn(`Error saving default to localStorage key "${key}" after read failure:`, saveError);
    }
    return defaultValue;
  }
};

// Helper function to save data to localStorage
const saveToLocalStorage = <T>(
  key: string,
  value: T,
  replacer?: (key: string, value: any) => any
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value, replacer));
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error);
  }
};

// Keys for localStorage
const PATIENTS_KEY = 'agendaMedicaPatients';
const MEDICAL_HISTORY_KEY = 'agendaMedicaMedicalHistory';
const APPOINTMENTS_KEY = 'agendaMedicaAppointments';
const NEXT_PATIENT_ID_KEY = 'agendaMedicaNextPatientId';
const NEXT_MEDICAL_ENTRY_ID_KEY = 'agendaMedicaNextMedicalEntryId';
const NEXT_APPOINTMENT_ID_KEY = 'agendaMedicaNextAppointmentId';

// --- Patient Data ---
const defaultPatients: Patient[] = [
  { 
    id: '1', 
    firstName: 'Ana', 
    lastName: 'Pérez', 
    dni: '12345678',
    age: 34, 
    gender: 'femenino', 
    address: 'Calle Falsa 123', 
    phone: '555-1234', 
    secondaryContact: '555-1111',
    email: 'ana.perez@example.com',
    socialWork: 'OSDE',
    chronicDiseases: 'Migraña',
    bloodType: 'A+'
  },
  { 
    id: '2', 
    firstName: 'Luis', 
    lastName: 'García', 
    dni: '87654321',
    age: 45, 
    gender: 'masculino', 
    address: 'Avenida Siempreviva 742', 
    phone: '555-5678', 
    email: 'luis.garcia@example.com',
    socialWork: 'Swiss Medical',
    chronicDiseases: undefined,
    bloodType: 'O-'
  },
  { 
    id: '3', 
    firstName: 'María', 
    lastName: 'Rodriguez', 
    dni: '11223344',
    age: 28, 
    gender: 'femenino', 
    address: 'Pasaje Seguro 45', 
    phone: '555-8765',
    secondaryContact: '555-2222', 
    email: 'maria.rodriguez@example.com',
    bloodType: 'B+',
    socialWork: 'Particular',
    chronicDiseases: 'Asma',
  },
];

export const getStoredPatients = (): Patient[] => {
  return getFromLocalStorage(PATIENTS_KEY, defaultPatients);
};

export const saveStoredPatients = (patients: Patient[]): void => {
  saveToLocalStorage(PATIENTS_KEY, patients);
};

export const getNextPatientId = (): string => {
  // Initialize counter based on the length of default patients + 1 if not found
  let counter = getFromLocalStorage(NEXT_PATIENT_ID_KEY, defaultPatients.length + 1);
  const nextId = String(counter);
  saveToLocalStorage(NEXT_PATIENT_ID_KEY, counter + 1);
  return nextId;
};

// --- Medical Entry Data ---
const defaultMedicalHistory: MedicalEntry[] = [
  { id: '1', patientId: '1', date: '2023-01-15', notes: 'Consulta general. Paciente refiere dolor de cabeza ocasional. Se recomienda descanso y hidratación.' },
  { id: '2', patientId: '1', date: '2023-06-20', notes: 'Chequeo anual. Todo en orden. Próxima revisión en un año.' },
  { id: '3', patientId: '2', date: '2023-03-10', notes: 'Revisión dental. Limpieza realizada. Se detecta caries leve en molar superior derecho.' },
];

export const getStoredMedicalHistory = (): MedicalEntry[] => {
  return getFromLocalStorage(MEDICAL_HISTORY_KEY, defaultMedicalHistory);
};

export const saveStoredMedicalHistory = (medicalEntries: MedicalEntry[]): void => {
  saveToLocalStorage(MEDICAL_HISTORY_KEY, medicalEntries);
};

export const getNextMedicalEntryId = (): string => {
  let counter = getFromLocalStorage(NEXT_MEDICAL_ENTRY_ID_KEY, defaultMedicalHistory.length + 1);
  const nextId = String(counter);
  saveToLocalStorage(NEXT_MEDICAL_ENTRY_ID_KEY, counter + 1);
  return nextId;
};

// --- Appointment Data ---
// Ensure patient IDs in defaultAppointments match IDs in defaultPatients for consistency
const defaultAppointments: Appointment[] = [
  { id: '1', patientId: '1', patientName: 'Ana Pérez', date: new Date(2024, 6, 18, 10, 0), reason: 'Consulta General', status: 'programada' },
  { id: '2', patientId: '2', patientName: 'Luis García', date: new Date(2024, 6, 18, 11, 30), reason: 'Revisión Dental', status: 'programada' },
  { id: '3', patientId: '3', patientName: 'María Rodriguez', date: new Date(2024, 6, 20, 9, 0), reason: 'Vacunación', status: 'completada' },
  { id: '4', patientId: '1', patientName: 'Ana Pérez', date: new Date(2024, 6, 25, 14, 0), reason: 'Seguimiento', status: 'programada' },
];

// Custom reviver for parsing dates from ISO strings
const appointmentReviver = (key: string, value: any) => {
  if (key === 'date' && typeof value === 'string') {
    const d = new Date(value);
    // Check if date is valid, otherwise return original string or null
    return isNaN(d.getTime()) ? value : d; 
  }
  return value;
};

export const getStoredAppointments = (): Appointment[] => {
  return getFromLocalStorage(APPOINTMENTS_KEY, defaultAppointments, appointmentReviver);
};

export const saveStoredAppointments = (appointments: Appointment[]): void => {
  saveToLocalStorage(APPOINTMENTS_KEY, appointments);
};

export const getNextAppointmentId = (): string => {
  let counter = getFromLocalStorage(NEXT_APPOINTMENT_ID_KEY, defaultAppointments.length + 1);
  const nextId = String(counter);
  saveToLocalStorage(NEXT_APPOINTMENT_ID_KEY, counter + 1);
  return nextId;
};
