import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent multiple instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services with proper v9+ syntax
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment with proper v9+ syntax)
export const analytics = typeof window !== 'undefined' ? 
  (async () => {
    try {
      const supported = await isSupported();
      return supported ? getAnalytics(app) : null;
    } catch {
      return null;
    }
  })() : null;

// App Check is completely disabled to prevent reCAPTCHA issues with Phone Auth
// This allows Firebase Phone Auth to work properly with test numbers
let appCheck: any = null;
console.log('🔧 App Check: Disabled to prevent reCAPTCHA issues with Phone Auth');

// Connect to emulators only if explicitly enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error);
  }
} else {
  console.log('🔧 Using production Firebase services');
}

export { appCheck };
export default app;
