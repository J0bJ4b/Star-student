import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import rawConfig from '../firebase-applet-config.json';

const env = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

// Support environment variables override on Vercel / GitHub
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || rawConfig?.apiKey || 'mock-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig?.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || rawConfig?.projectId || 'star-deeds-demo',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig?.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig?.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || rawConfig?.appId || '1:123456:web:abcdef',
};

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore (configured with databaseId if specified in config)
const firestoreDbId =
  env.VITE_FIREBASE_DATABASE_ID ||
  (rawConfig as { firestoreDatabaseId?: string })?.firestoreDatabaseId;

export const db = firestoreDbId
  ? getFirestore(app, firestoreDbId)
  : getFirestore(app);

export default app;

