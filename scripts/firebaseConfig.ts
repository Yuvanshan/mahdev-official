import 'dotenv/config';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required Firebase environment variable: ${name}.`);
  return value;
}

export function getFirebaseConfig() {
  return {
    firebaseConfig: {
      apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
      authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: requiredEnv('VITE_FIREBASE_APP_ID'),
    },
    firestoreDatabaseId: requiredEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID'),
  };
}
