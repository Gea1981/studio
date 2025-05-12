'use server';

import { db } from './firebase';
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
const usersCollection = collection(db, 'users');
const SALT_ROUNDS = 10;

export async function ensureAdminUserExists(): Promise<UserCredentials> {
  const adminUsername = 'admin';
  const adminDocRef = doc(db, 'users', adminUsername); // Use username as document ID for admin

  try {
    let adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      console.log("Admin user not found, creating...");
      const hashedPassword = await bcrypt.hash('password', SALT_ROUNDS);
      const adminData: Omit<UserCredentials, 'id'> & { passwordHash: string } = {
        username: adminUsername,
        passwordHash: hashedPassword,
        // password_plaintext is not stored
      };
      await setDoc(adminDocRef, adminData);
      // Re-fetch to confirm creation and get consistent data structure
      adminDocSnap = await getDoc(adminDocRef);
      if (!adminDocSnap.exists()) {
        throw new Error("Failed to create admin user.");
      }
      console.log("Admin user created successfully.");
      // For UserCredentials type, we derive id from username for admin, and don't expose hash
      return { id: adminDocSnap.id, username: adminDocSnap.data()?.username } as UserCredentials;
    } else {
      console.log("Admin user already exists.");
      const data = adminDocSnap.data();
      return { id: adminDocSnap.id, username: data?.username } as UserCredentials;
    }
  } catch (e: any) {
    console.error("Error in ensureAdminUserExists:", e.message);
     if (e.code === 'unavailable' || e.message.toLowerCase().includes('offline') || e.message.toLowerCase().includes('network error')) {
      throw new Error(`Firebase offline or not configured. Please check your internet connection and Firebase project setup in src/lib/firebase.ts. Original error: ${e.message}`);
    }
    throw new Error(`Failed to ensure admin user: ${e.message}`);
  }
}


export const getUserByUsername = async (username: string): Promise<(UserCredentials & {passwordHash: string}) | null> => {
  try {
    const q = query(usersCollection, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Special check for admin, as it might be created with username as ID
      if (username === 'admin') {
        const adminDocRef = doc(db, 'users', 'admin');
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          return { id: adminDocSnap.id, username: data.username, passwordHash: data.passwordHash } as UserCredentials & {passwordHash: string};
        }
      }
      return null;
    }
    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    return { id: userDoc.id, username: data.username, passwordHash: data.passwordHash } as UserCredentials & {passwordHash: string};
  } catch (error) {
    console.error("Error fetching user by username:", error);
    throw error;
  }
};

export const addUserToFirestore = async (userData: Omit<UserCredentials, 'id' | 'password_plaintext'> & {password_plaintext: string}): Promise<UserCredentials> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password_plaintext, SALT_ROUNDS);
    const userToSave = {
      username: userData.username,
      passwordHash: hashedPassword,
    };
    const docRef = await addDoc(usersCollection, userToSave);
    return { id: docRef.id, username: userToSave.username, password_plaintext: '' /* don't return plaintext */ };
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

export const updateUserInFirestore = async (userId: string, userData: Partial<Omit<UserCredentials, 'id' | 'password_plaintext'> & {password_plaintext?: string}>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: any = { username: userData.username };
    if (userData.password_plaintext && userData.password_plaintext.length > 0) {
      updateData.passwordHash = await bcrypt.hash(userData.password_plaintext, SALT_ROUNDS);
    }
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getAllUsersFromFirestore = async (): Promise<UserCredentials[]> => {
  try {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Note: password_plaintext is not stored, so it won't be part of the returned object
      // For the purpose of displaying in UserList, this is fine.
      // If password_plaintext was needed (it shouldn't be), this would need adjustment.
      return { id: doc.id, username: data.username } as Omit<UserCredentials, 'password_plaintext'> & {password_plaintext?: string} ;
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

// --- Patient Services ---
const patientsCollectionRef = collection(db, 'patients');

export const getAllPatientsFromFirestore = async (): Promise<Patient[]> => {
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
  try {
    const docRef = await addDoc(patientsCollectionRef, patientData);
    return { ...patientData, id: docRef.id };
  } catch (error) {
    console.error("Error adding patient to Firestore:", error);
    throw error;
  }
};

export const updatePatientInFirestore = async (patientId: string, patientData: Partial<Omit<Patient, 'id'>>): Promise<void> => {
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    await updateDoc(patientDocRef, patientData);
  } catch (error) {
    console.error("Error updating patient in Firestore:", error);
    throw error;
  }
};

export const deletePatientFromFirestore = async (patientId: string): Promise<void> => {
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    // Optionally, delete related medical entries and appointments
    // For now, just deleting the patient.
    await deleteDoc(patientDocRef);
  } catch (error) {
    console.error("Error deleting patient from Firestore:", error);
    throw error;
  }
};


// --- Medical Entry Services ---
const medicalEntriesCollectionRef = collection(db, 'medicalEntries');

export const getAllMedicalEntriesFromFirestore = async (): Promise<MedicalEntry[]> => {
  try {
    const q = query(medicalEntriesCollectionRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      // Convert Firestore Timestamp to "YYYY-MM-DD" string
      const dateFromTimestamp = (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date as string;
      return {
        id: docSnapshot.id,
        patientId: data.patientId,
        date: dateFromTimestamp,
        notes: data.notes,
      } as MedicalEntry;
    });
  } catch (error) {
    console.error("Error fetching all medical entries from Firestore:", error);
    throw error;
  }
};

export const addMedicalEntryToFirestore = async (entryData: Omit<MedicalEntry, 'id'>): Promise<MedicalEntry> => {
  try {
    // Convert "YYYY-MM-DD" string date to Firestore Timestamp
    const dataToSave = {
      ...entryData,
      date: Timestamp.fromDate(new Date(entryData.date + "T00:00:00")), // Ensure correct date parsing for Timestamp
    };
    const docRef = await addDoc(medicalEntriesCollectionRef, dataToSave);
    // Return with original string date format for consistency in UI
    return { ...entryData, id: docRef.id };
  } catch (error) {
    console.error("Error adding medical entry to Firestore: ", error);
    throw error;
  }
};


// --- Appointment Services ---
const appointmentsCollectionRef = collection(db, 'appointments');

export const getAllAppointmentsFromFirestore = async (): Promise<Appointment[]> => {
  try {
    const q = query(appointmentsCollectionRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        date: (data.date as Timestamp).toDate(), // Convert Firestore Timestamp to JS Date
      } as Appointment;
    });
  } catch (error) {
    console.error("Error fetching all appointments from Firestore:", error);
    throw error;
  }
};

export const addAppointmentToFirestore = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  try {
    const dataToSave = {
      ...appointmentData,
      date: Timestamp.fromDate(appointmentData.date), // Convert JS Date to Firestore Timestamp
    };
    const docRef = await addDoc(appointmentsCollectionRef, dataToSave);
    return { ...appointmentData, id: docRef.id };
  } catch (error) {
    console.error("Error adding appointment to Firestore:", error);
    throw error;
  }
};

export const updateAppointmentInFirestore = async (appointmentId: string, appointmentData: Partial<Omit<Appointment, 'id'>>): Promise<void> => {
  try {
    const appointmentDocRef = doc(db, 'appointments', appointmentId);
    const dataToUpdate: Partial<any> = { ...appointmentData };
    if (appointmentData.date) {
      dataToUpdate.date = Timestamp.fromDate(appointmentData.date); // Convert JS Date to Firestore Timestamp
    }
    await updateDoc(appointmentDocRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating appointment in Firestore:", error);
    throw error;
  }
};

export const deleteAppointmentFromFirestore = async (appointmentId: string): Promise<void> => {
  try {
    const appointmentDocRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentDocRef);
  } catch (error) {
    console.error("Error deleting appointment from Firestore:", error);
    throw error;
  }
};