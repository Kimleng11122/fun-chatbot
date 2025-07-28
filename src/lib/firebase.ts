import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if environment variables are available
let db: Firestore | null = null;

if (!getApps().length) {
  // Check if all required environment variables are present
  const requiredVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing Firebase environment variables:', missingVars);
    console.error('Please check your Vercel environment variables configuration');
  } else {
    try {
      // Properly format the private key by replacing escaped newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully');
      
      // Initialize Firestore after app initialization
      db = getFirestore();
      console.log('Firestore database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      console.error('Please check your Firebase service account credentials');
    }
  }
} else {
  // If apps already exist, get the Firestore instance
  db = getFirestore();
  console.log('Using existing Firebase app, Firestore initialized');
}

// Export db
export { db };

// Add a helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return db !== null;
}

// Client-side Firebase config (for future use)
export const firebaseConfig = {
  apiKey: "AIzaSyCPMFMbmf4Y4RvVm4dIpdCAMWHjaOZvd5g",
  authDomain: "nubiq-docs-2024.firebaseapp.com",
  projectId: "nubiq-docs-2024",
  storageBucket: "nubiq-docs-2024.firebasestorage.app",
  messagingSenderId: "1029032042704",
  appId: "1:1029032042704:web:aeb53597cf0b629874bed5"
}; 