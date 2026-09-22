import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const env = import.meta.env as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: env["VITE_FIREBASE_API_KEY"] ?? "",
  authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "the-pounds-tracker.firebaseapp.com",
  projectId: env["VITE_FIREBASE_PROJECT_ID"] ?? "the-pounds-tracker",
  storageBucket: env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "the-pounds-tracker.firebasestorage.app",
  messagingSenderId: env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "711016617322",
  appId: env["VITE_FIREBASE_APP_ID"] ?? "1:711016617322:web:7372d8c407604fbbcf4113",
  measurementId: env["VITE_FIREBASE_MEASUREMENT_ID"] ?? "",
};

export const isFirebaseConfigured = firebaseConfig.apiKey.length > 0;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("FIREBASE_NOT_CONFIGURED");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}
