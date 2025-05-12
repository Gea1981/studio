// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
// import { getAnalytics, Analytics } from "firebase/analytics"; // Optional: if you need analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
// let analytics: Analytics; // Optional

// Check if essential config values are missing or are placeholders like "YOUR_API_KEY"
const essentialConfigsAreMissingOrPlaceholders =
  !firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY' ||
  !firebaseConfig.projectId || firebaseConfig.projectId === 'YOUR_PROJECT_ID' ||
  !firebaseConfig.authDomain || firebaseConfig.authDomain === 'YOUR_AUTH_DOMAIN' ||
  !firebaseConfig.storageBucket || firebaseConfig.storageBucket === 'YOUR_STORAGE_BUCKET' ||
  !firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId === 'YOUR_MESSAGING_SENDER_ID' ||
  !firebaseConfig.appId || firebaseConfig.appId === 'YOUR_APP_ID';

if (essentialConfigsAreMissingOrPlaceholders) {
  const errorMessage =
    'CRITICAL: Firebase configuration is missing or using placeholder values. ' +
    'Please ensure environment variables (NEXT_PUBLIC_FIREBASE_...) are correctly set in your .env.local file, ' +
    'or update src/lib/firebase.ts with your actual Firebase project details. ' +
    'Firebase services will not be initialized.';
  console.error(errorMessage);
  // To prevent the app from crashing hard if firebase is not configured during early dev,
  // we allow it to proceed but db/auth will be undefined. Operations using them will fail.
  // In a production build or stricter dev environment, you might throw an error here:
  // throw new Error(errorMessage);
}

if (getApps().length === 0) {
  if (essentialConfigsAreMissingOrPlaceholders) {
    console.warn(
      'Firebase app initialization skipped due to missing/placeholder configuration.'
    );
    // @ts-ignore - Assign null to satisfy type for uninitialized state
    app = null; 
    // @ts-ignore
    db = null;
    // @ts-ignore
    auth = null;
  } else {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      // if (typeof window !== 'undefined') { // Initialize analytics only on client side
      //   analytics = getAnalytics(app);
      // }
      console.log('Firebase initialized successfully.');
    } catch (e) {
      console.error('Error initializing Firebase:', e);
      // @ts-ignore
      app = null;
      // @ts-ignore
      db = null;
      // @ts-ignore
      auth = null;
    }
  }
} else {
  app = getApps()[0];
  // Ensure db and auth are also re-assigned if app was already initialized
  // This handles HMR or scenarios where this module might be re-evaluated.
  if (!essentialConfigsAreMissingOrPlaceholders) {
    db = getFirestore(app);
    auth = getAuth(app);
    // if (typeof window !== 'undefined' && !analytics) { // Ensure analytics is initialized if app was already there
    //   analytics = getAnalytics(app);
    // }
  } else {
     // @ts-ignore
    db = null;
    // @ts-ignore
    auth = null;
  }
}

export { app, db, auth };
// export { app, db, auth, analytics }; // If using analytics
