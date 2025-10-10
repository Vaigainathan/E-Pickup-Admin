import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// reCAPTCHA Configuration for Admin Dashboard
export const recaptchaConfig = {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  secretKey: import.meta.env.VITE_RECAPTCHA_SECRET_KEY,
};

// Initialize App Check with reCAPTCHA v3 for admin dashboard (web app)
let appCheck: any = null;

if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ App Check: Initialized with reCAPTCHA v3 for admin dashboard');
  } catch (error) {
    console.warn('⚠️ App Check: Failed to initialize with reCAPTCHA:', error);
    appCheck = null;
  }
} else {
  console.log('🔧 App Check: Disabled for admin dashboard (no reCAPTCHA site key)');
  console.log('🔧 reCAPTCHA: Configured for admin dashboard security');
  console.log('🔧 Security: Admin dashboard uses email/password + reCAPTCHA v3');
}

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
