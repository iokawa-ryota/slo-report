import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase の設定情報
// https://console.firebase.google.com から取得して以下を埋める
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const hasPlaceholderValue = (value) => (
  !value ||
  value.includes('your_') ||
  value === 'your-project-id'
);

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => !hasPlaceholderValue(value)
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Authentication を初期化
export const auth = app ? getAuth(app) : null;

// Firestore を初期化
export const db = app ? getFirestore(app) : null;

export default app;
