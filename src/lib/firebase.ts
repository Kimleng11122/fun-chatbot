import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if environment variables are available
const apps = getApps();

if (!apps.length && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    // Properly format the private key by replacing escaped newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

// Export db only if Firebase is initialized
export const db = apps.length > 0 ? getFirestore() : null;

// Client-side Firebase config (for future use)
export const firebaseConfig = {
  apiKey: "AIzaSyCPMFMbmf4Y4RvVm4dIpdCAMWHjaOZvd5g",
  authDomain: "nubiq-docs-2024.firebaseapp.com",
  projectId: "nubiq-docs-2024",
  storageBucket: "nubiq-docs-2024.firebasestorage.app",
  messagingSenderId: "1029032042704",
  appId: "1:1029032042704:web:aeb53597cf0b629874bed5"
}; 