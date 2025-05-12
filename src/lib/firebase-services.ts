
'use server';

import { db, auth as firebaseAuthInstance } from '@/lib/firebase'; // Corrected import path
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import type { UserCredentials, Patient, MedicalEntry, Appointment } from '@/types';
import bcrypt from 'bcryptjs'; // For password hashing

// --- User Services ---
const SALT_ROUNDS = 10;

export async function ensureAdminUserExists(): Promise<UserCredentials | null> {
  if (!db) {
    console.error("Firestore instance (db) is not available in ensureAdminUserExists. Firebase might not be configured or initialized correctly.");
    throw new Error("Firestore not initialized. Check Firebase configuration in .env.local and src/lib/firebase.ts.");
  }
  const usersCollectionRef = collection(db, 'users');
  const adminUsername = 'admin';
  // Attempt to use username as document ID for admin for simplicity and direct access
  const adminDocRef = doc(db, 'users', adminUsername);

  try {
    let adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      console.log("Admin user (document ID 'admin') not found, attempting to create...");
      // Check if an admin user exists with a different ID but username 'admin'
      const q = query(usersCollectionRef, where("username", "==", adminUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log("Admin user found with a different document ID. Using existing admin.");
        adminDocSnap = querySnapshot.docs[0];
        const data = adminDocSnap.data();
        return { id: adminDocSnap.id, username: data?.username, password_plaintext: '' }; // Return with existing ID
      }
      
      // If still no admin user, create one with ID 'admin'
      console.log("No admin user found by query either. Creating new admin user with ID 'admin'.");
      const hashedPassword = await bcrypt.hash('password', SALT_ROUNDS); // Default password
      const adminData: { username: string; passwordHash: string } = {
        username: adminUsername,
        passwordHash: hashedPassword,
      };
      await setDoc(adminDocRef, adminData);
      console.log("Admin user created successfully with ID 'admin'.");
      return { id: adminDocRef.id, username: adminData.username, password_plaintext: '' };

    } else {
      console.log("Admin user (document ID 'admin') already exists.");
      const data = adminDocSnap.data();
      // Ensure passwordHash exists, if not, this could be an old record or partial write.
      if (!data?.passwordHash) {
        console.warn("Admin user exists but 'passwordHash' is missing. Re-creating hash for default password 'password'.");
        const hashedPassword = await bcrypt.hash('password', SALT_ROUNDS);
        await updateDoc(adminDocRef, { passwordHash: hashedPassword });
      }
      return { id: adminDocSnap.id, username: data?.username, password_plaintext: '' };
    }
  } catch (e: any) {
    console.error("Error in ensureAdminUserExists:", e.message);
     if (e.code === 'unavailable' || e.message.toLowerCase().includes('offline') || e.message.toLowerCase().includes('network error')) {
      throw new Error(`Firebase offline or not configured. Please check your internet connection and Firebase project setup. Original error: ${e.message}`);
    }
    throw new Error(`Failed to ensure admin user: ${e.message}`);
  }
}


export const getUserByUsername = async (username: string): Promise<(UserCredentials & {passwordHash: string}) | null> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in getUserByUsername.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const usersCollectionRef = collection(db, 'users');
  try {
    // First, check if the user is 'admin' and try to get by ID 'admin'
    if (username === 'admin') {
      const adminDocRef = doc(db, 'users', 'admin');
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        const data = adminDocSnap.data();
        if (data.username === 'admin' && data.passwordHash) { // Ensure it's actually the admin user and has a hash
          return { id: adminDocSnap.id, username: data.username, passwordHash: data.passwordHash, password_plaintext: '' };
        }
      }
    }

    // Fallback to querying by username field for any user, including admin if ID is different
    const q = query(usersCollectionRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    if (!data.passwordHash) {
        console.warn(`User ${username} found but has no passwordHash. Cannot authenticate.`);
        return null;
    }
    return { id: userDoc.id, username: data.username, passwordHash: data.passwordHash, password_plaintext: '' };
  } catch (error: any) {
    console.error("Error fetching user by username:", error.message);
    if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        throw new Error(`Firebase offline or network issue when fetching user by username. Check connection. Original: ${error.message}`);
    }
    throw error;
  }
};

export const addUserToFirestore = async (userData: Omit<UserCredentials, 'id' | 'password_plaintext'> & {password_plaintext: string}): Promise<UserCredentials> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in addUserToFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const usersCollectionRef = collection(db, 'users');
  try {
    const hashedPassword = await bcrypt.hash(userData.password_plaintext, SALT_ROUNDS);
    const userToSave = {
      username: userData.username,
      passwordHash: hashedPassword,
    };
    // For admin, always use 'admin' as document ID. For others, generate ID.
    if (userData.username === 'admin') {
        const adminDocRef = doc(db, 'users', 'admin');
        await setDoc(adminDocRef, userToSave);
        return { id: 'admin', username: userToSave.username, password_plaintext: '' };
    } else {
        const docRef = await addDoc(usersCollectionRef, userToSave);
        return { id: docRef.id, username: userToSave.username, password_plaintext: '' };
    }
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

export const updateUserInFirestore = async (userId: string, userData: Partial<Omit<UserCredentials, 'id' | 'password_plaintext'> & {password_plaintext?: string}>): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in updateUserInFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: any = { }; // Initialize empty object

    if (userData.username !== undefined) {
        updateData.username = userData.username;
    }

    if (userData.password_plaintext && userData.password_plaintext.length > 0) {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().username === 'admin' && (userId === 'admin' || userData.username === 'admin')) {
            console.warn("Attempt to change admin password was blocked.");
      } else { 
         updateData.passwordHash = await bcrypt.hash(userData.password_plaintext, SALT_ROUNDS);
      }
    }
    
    if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in deleteUserFromFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().username === 'admin') {
        console.warn("Attempt to delete admin user was blocked.");
        throw new Error("Admin user cannot be deleted.");
    }
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getAllUsersFromFirestore = async (): Promise<UserCredentials[]> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in getAllUsersFromFirestore. Returning empty array.");
    return []; 
  }
  const usersCollectionRef = collection(db, 'users');
  try {
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, username: data.username, password_plaintext: '' } ; 
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

// --- Patient Services ---

export const getAllPatientsFromFirestore = async (): Promise<Patient[]> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in getAllPatientsFromFirestore. Returning empty array.");
    return [];
  }
  const patientsCollectionRef = collection(db, 'patients');
  try {
    const q = query(patientsCollectionRef, orderBy('lastName'), orderBy('firstName'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  } catch (error) {
    console.error("Error fetching all patients from Firestore:", error);
    throw error;
  }
};

export const addPatientToFirestore = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in addPatientToFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const patientsCollectionRef = collection(db, 'patients');
  try {
    const docRef = await addDoc(patientsCollectionRef, patientData);
    return { ...patientData, id: docRef.id };
  } catch (error) {
    console.error("Error adding patient to Firestore:", error);
    throw error;
  }
};

export const updatePatientInFirestore = async (patientId: string, patientData: Partial<Omit<Patient, 'id'>>): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in updatePatientInFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    await updateDoc(patientDocRef, patientData);
  } catch (error) {
    console.error("Error updating patient in Firestore:", error);
    throw error;
  }
};

export const deletePatientFromFirestore = async (patientId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in deletePatientFromFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const medicalEntriesCollectionRef = collection(db, 'medicalEntries');
  const appointmentsCollectionRef = collection(db, 'appointments');
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    const batch = writeBatch(db);

    const medicalEntriesQuery = query(medicalEntriesCollectionRef, where('patientId', '==', patientId));
    const medicalEntriesSnapshot = await getDocs(medicalEntriesQuery);
    medicalEntriesSnapshot.forEach(doc => batch.delete(doc.ref));

    const appointmentsQuery = query(appointmentsCollectionRef, where('patientId', '==', patientId));
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    appointmentsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    batch.delete(patientDocRef);

    await batch.commit();
  } catch (error) {
    console.error("Error deleting patient and related data from Firestore:", error);
    throw error;
  }
};


// --- Medical Entry Services ---

export const getAllMedicalEntriesFromFirestore = async (): Promise<MedicalEntry[]> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in getAllMedicalEntriesFromFirestore. Returning empty array.");
    return [];
  }
  const medicalEntriesCollectionRef = collection(db, 'medicalEntries');
  try {
    const q = query(medicalEntriesCollectionRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      const dateValue = data.date;
      let entryDateString: string;

      if (dateValue instanceof Timestamp) {
        entryDateString = dateValue.toDate().toISOString().split('T')[0];
      } else if (typeof dateValue === 'string') {
        // Attempt to parse if it's a string that might be a full ISO string or just YYYY-MM-DD
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          entryDateString = parsedDate.toISOString().split('T')[0];
        } else {
          entryDateString = dateValue; // Assume it's already YYYY-MM-DD
        }
      } else {
         console.warn(`Medical entry ${docSnapshot.id} has an unexpected date format:`, dateValue);
        entryDateString = new Date().toISOString().split('T')[0]; // Fallback to today
      }
      
      return {
        id: docSnapshot.id,
        patientId: data.patientId,
        date: entryDateString,
        notes: data.notes,
      } as MedicalEntry;
    });
  } catch (error) {
    console.error("Error fetching all medical entries from Firestore:", error);
    throw error;
  }
};

export const addMedicalEntryToFirestore = async (entryData: Omit<MedicalEntry, 'id'>): Promise<MedicalEntry> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in addMedicalEntryToFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const medicalEntriesCollectionRef = collection(db, 'medicalEntries');
  try {
    // Ensure date is stored as YYYY-MM-DD, then convert to Timestamp for Firestore
    const dateParts = entryData.date.split('-'); // Expects "YYYY-MM-DD"
    // Create Date object at UTC to avoid timezone shifts when converting to Timestamp
    const utcDate = new Date(Date.UTC(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])));

    const dataToSave = {
      ...entryData,
      date: Timestamp.fromDate(utcDate), 
    };
    const docRef = await addDoc(medicalEntriesCollectionRef, dataToSave);
    // Return original string date for consistency in app state, and the new ID
    return { ...entryData, id: docRef.id }; 
  } catch (error) {
    console.error("Error adding medical entry to Firestore: ", error);
    throw error;
  }
};


// --- Appointment Services ---

export const getAllAppointmentsFromFirestore = async (): Promise<Appointment[]> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in getAllAppointmentsFromFirestore. Returning empty array.");
    return [];
  }
  const appointmentsCollectionRef = collection(db, 'appointments');
  try {
    const q = query(appointmentsCollectionRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      // Ensure date is converted from Firestore Timestamp to JS Date object
      const appointmentDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
      return {
        id: docSnapshot.id,
        ...data,
        date: appointmentDate, 
      } as Appointment;
    });
  } catch (error) {
    console.error("Error fetching all appointments from Firestore:", error);
    throw error;
  }
};

export const addAppointmentToFirestore = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in addAppointmentToFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  const appointmentsCollectionRef = collection(db, 'appointments');
  try {
    // Convert JS Date to Firestore Timestamp before saving
    const dataToSave = {
      ...appointmentData,
      date: Timestamp.fromDate(appointmentData.date), 
    };
    const docRef = await addDoc(appointmentsCollectionRef, dataToSave);
    // Return with the original JS Date object for immediate use in the app state
    return { ...appointmentData, id: docRef.id };
  } catch (error) {
    console.error("Error adding appointment to Firestore:", error);
    throw error;
  }
};

export const updateAppointmentInFirestore = async (appointmentId: string, appointmentData: Partial<Omit<Appointment, 'id'>>): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in updateAppointmentInFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  try {
    const appointmentDocRef = doc(db, 'appointments', appointmentId);
    const dataToUpdate: Partial<any> = { ...appointmentData };
    // If date is being updated, convert it to Timestamp
    if (appointmentData.date) {
      dataToUpdate.date = Timestamp.fromDate(appointmentData.date); 
    }
    await updateDoc(appointmentDocRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating appointment in Firestore:", error);
    throw error;
  }
};

export const deleteAppointmentFromFirestore = async (appointmentId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore instance (db) is not available in deleteAppointmentFromFirestore.");
    throw new Error("Firestore not initialized. Check Firebase configuration.");
  }
  try {
    const appointmentDocRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentDocRef);
  } catch (error) {
    console.error("Error deleting appointment from Firestore:", error);
    throw error;
  }
};
