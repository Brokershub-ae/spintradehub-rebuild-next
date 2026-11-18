import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase initialized with spintradehubwebsite project for unified Android + Web sync
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Initialize only on client-side to avoid build errors and handle missing env values gracefully.
if (typeof window !== 'undefined') {
  const configReady = Object.values(firebaseConfig).every((value) => Boolean(value));

  if (configReady) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn('Firebase config is missing. Auth and Firestore features are disabled until environment variables are set.');
  }
}

export { auth, db, storage };
export default app;
