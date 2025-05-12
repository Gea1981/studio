import type { Patient, Appointment, MedicalEntry, UserCredentials } from '@/types';

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
      // First attempt to parse with reviver if provided
      if (reviver) {
        try {
            return JSON.parse(item, reviver);
        } catch (parseError) {
            console.warn(`Error parsing localStorage key "${key}" with reviver, falling back to default parse:`, parseError);
            // Fallback to default JSON.parse if reviver fails (e.g., malformed date)
            return JSON.parse(item); 
        }
      }
      // If no reviver, just parse normally
      return JSON.parse(item);
    }
    // If item doesn't exist, set default value and return it
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
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
const USERS_KEY = 'agendaMedicaUsers';
const NEXT_PATIENT_ID_KEY = 'agendaMedicaNextPatientId';
const NEXT_MEDICAL_ENTRY_ID_KEY = 'agendaMedicaNextMedicalEntryId';
const NEXT_APPOINTMENT_ID_KEY = 'agendaMedicaNextAppointmentId';
const NEXT_USER_ID_KEY = 'agendaMedicaNextUserId'; 

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
    chronicDiseases: ['Migraña'], // Updated to array
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
    chronicDiseases: undefined, // Keep as undefined if none
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
    chronicDiseases: ['Asma', 'Alergia al Polvo'], // Updated to array
  },
];

export const getStoredPatients = (): Patient[] => {
  // Need to ensure existing data is migrated if it was stored as string
  const rawData = getFromLocalStorage<any[]>(PATIENTS_KEY, defaultPatients);
  return rawData.map(p => ({
      ...p,
      chronicDiseases: typeof p.chronicDiseases === 'string' 
                        ? (p.chronicDiseases.trim() ? p.chronicDiseases.split(',').map((s:string) => s.trim()) : []) 
                        : (Array.isArray(p.chronicDiseases) ? p.chronicDiseases : undefined)
  }));
};


export const saveStoredPatients = (patients: Patient[]): void => {
  // Ensure chronicDiseases is saved correctly as an array or undefined
  const dataToSave = patients.map(p => ({
    ...p,
    chronicDiseases: p.chronicDiseases && p.chronicDiseases.length > 0 ? p.chronicDiseases : undefined,
  }));
  saveToLocalStorage(PATIENTS_KEY, dataToSave);
};


// Function to get the next sequential ID based on existing max ID or default length
const getNextSequentialId = (existingItems: { id: string }[], defaultStart: number): string => {
  let maxIdNum = 0;
  existingItems.forEach(item => {
    // Assuming IDs are numeric strings
    const numPart = parseInt(item.id, 10);
    if (!isNaN(numPart) && numPart > maxIdNum) {
      maxIdNum = numPart;
    }
  });
  return String(Math.max(defaultStart, maxIdNum) + 1);
};

// Modified function to get next ID using localStorage counter for better persistence across sessions
const getNextIdUsingCounter = (key: string, initialMax: number): string => {
  let counter = getFromLocalStorage(key, initialMax);
  const nextId = String(counter);
  saveToLocalStorage(key, counter + 1);
  return nextId;
};

export const getNextPatientId = (): string => {
  const patients = getStoredPatients(); // Get current patients to determine starting point if counter is missing/reset
  const defaultStart = defaultPatients.length; // Default starting point based on initial static data
  const initialMax = Math.max(defaultStart, patients.length > 0 ? Math.max(...patients.map(p => parseInt(p.id, 10)).filter(id => !isNaN(id))) + 1 : 1);
  return getNextIdUsingCounter(NEXT_PATIENT_ID_KEY, initialMax);
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
   const history = getStoredMedicalHistory();
   const defaultStart = defaultMedicalHistory.length;
   const initialMax = Math.max(defaultStart, history.length > 0 ? Math.max(...history.map(h => parseInt(h.id, 10)).filter(id => !isNaN(id))) + 1 : 1);
   return getNextIdUsingCounter(NEXT_MEDICAL_ENTRY_ID_KEY, initialMax);
};

// --- Appointment Data ---
const defaultAppointments: Appointment[] = [
  { id: '1', patientId: '1', patientName: 'Ana Pérez', date: new Date(2024, 6, 18, 10, 0), reason: 'Consulta General', status: 'programada' },
  { id: '2', patientId: '2', patientName: 'Luis García', date: new Date(2024, 6, 18, 11, 30), reason: 'Revisión Dental', status: 'programada' },
  { id: '3', patientId: '3', patientName: 'María Rodriguez', date: new Date(2024, 6, 20, 9, 0), reason: 'Vacunación', status: 'completada' },
  { id: '4', patientId: '1', patientName: 'Ana Pérez', date: new Date(2024, 6, 25, 14, 0), reason: 'Seguimiento', status: 'programada' },
];

// Reviver for Date objects when parsing Appointments from JSON
const appointmentReviver = (key: string, value: any) => {
  if (key === 'date' && typeof value === 'string') {
    const d = new Date(value);
    // Check if the date is valid before returning
    return isNaN(d.getTime()) ? value : d; // Return original string if invalid, otherwise Date object
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
   const appointments = getStoredAppointments();
   const defaultStart = defaultAppointments.length;
   const initialMax = Math.max(defaultStart, appointments.length > 0 ? Math.max(...appointments.map(a => parseInt(a.id, 10)).filter(id => !isNaN(id))) + 1 : 1);
   return getNextIdUsingCounter(NEXT_APPOINTMENT_ID_KEY, initialMax);
};

// --- User Data ---
const defaultUsers: UserCredentials[] = [
  { id: 'user-001', username: 'admin', password_plaintext: 'password' },
];

export const getStoredUsers = (): UserCredentials[] => {
  // Ensure admin user exists with the correct plaintext password if storage gets cleared/corrupted
  let users = getFromLocalStorage(USERS_KEY, defaultUsers);
  const adminUser = users.find(u => u.username === 'admin');
  if (!adminUser) {
    users.push(defaultUsers[0]); // Add default admin if missing
    saveStoredUsers(users); // Save back to storage
  } else if (adminUser.password_plaintext !== 'password') {
      // Correct the admin password if it was somehow changed (edge case for this mock setup)
      adminUser.password_plaintext = 'password';
      saveStoredUsers(users);
  }
  return users;
};

export const saveStoredUsers = (users: UserCredentials[]): void => {
  saveToLocalStorage(USERS_KEY, users);
};

// Function to get next User ID (e.g., user-002, user-003)
const getNextUserIdCounter = (key: string, initialMax: number): string => {
  let counter = getFromLocalStorage(key, initialMax);
  const nextIdNum = counter;
  saveToLocalStorage(key, counter + 1);
  return `user-${String(nextIdNum).padStart(3, '0')}`;
};

export const getNextUserId = (): string => {
  const users = getStoredUsers();
  let maxIdNum = 0;
  users.forEach(user => {
    if (user.id.startsWith('user-')) {
      const numPart = parseInt(user.id.split('-')[1], 10);
      if (!isNaN(numPart) && numPart > maxIdNum) {
        maxIdNum = numPart;
      }
    }
  });
  const defaultStartNum = defaultUsers.length > 0 ? parseInt(defaultUsers[defaultUsers.length - 1].id.split('-')[1], 10) : 0;
  const initialMax = Math.max(defaultStartNum, maxIdNum) + 1; // Start counter from next available number
  return getNextUserIdCounter(NEXT_USER_ID_KEY, initialMax);
};
