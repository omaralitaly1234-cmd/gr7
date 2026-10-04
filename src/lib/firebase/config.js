import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Firestore cache: in MEMORY, not IndexedDB.
//
// The persistent (IndexedDB) cache made searches slower the longer an admin
// used the app: every member doc ever read (the Excel exports alone read
// thousands) stayed in the browser, each query was also run against that
// growing local copy, and every result was written back to it. Nothing reads
// from the local cache on purpose — check-in is a transaction and needs the
// network anyway — and repeat reads are already served by ./read-cache.
let db;
if (typeof window !== 'undefined' && getApps().length === 1) {
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch {
    // Fallback if already initialized (e.g., HMR in dev)
    db = getFirestore(app);
  }
} else {
  // Server-side or already initialized
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

// Analytics (client-side only, lazy)
export let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then(supported => {
      if (supported) analytics = getAnalytics(app);
    });
  }).catch(() => {});
}

export default app;
