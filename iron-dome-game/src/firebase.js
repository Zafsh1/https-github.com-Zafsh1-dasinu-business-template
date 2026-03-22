// ============================================================
// Firebase Configuration
// Replace with your own Firebase project config
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "demo-api-key",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "iron-shield-demo.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "iron-shield-demo",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "iron-shield-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:000000000000:web:demo",
};

export const APP_ID = import.meta.env.VITE_APP_ID || 'iron-shield-v1';

let app, db, auth;

try {
  app  = initializeApp(firebaseConfig);
  db   = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase init failed – running in offline mode:', e.message);
}

export { db, auth };

// ─── Firestore paths (per spec) ─────────────────────────
export const PATHS = {
  globalStats: `/artifacts/${APP_ID}/public/data/globalStats`,
  userScore:   (userId) => `/artifacts/${APP_ID}/users/${userId}/scores/best`,
};

// ─── Anonymous sign-in ──────────────────────────────────
export async function signInAnon() {
  if (!auth) return null;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (e) {
    console.warn('Anonymous sign-in failed:', e.message);
    return null;
  }
}

export function onAuthChange(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}
