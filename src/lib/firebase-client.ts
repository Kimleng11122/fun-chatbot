import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPMFMbmf4Y4RvVm4dIpdCAMWHjaOZvd5g",
  authDomain: "nubiq-docs-2024.firebaseapp.com",
  projectId: "nubiq-docs-2024",
  storageBucket: "nubiq-docs-2024.firebasestorage.app",
  messagingSenderId: "1029032042704",
  appId: "1:1029032042704:web:aeb53597cf0b629874bed5"
};

// Initialize Firebase for client-side
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const dbClient = getFirestore(app);

export default app; 