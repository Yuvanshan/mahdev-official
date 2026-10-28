import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './firebaseConfig';

const { firebaseConfig, firestoreDatabaseId } = getFirebaseConfig();
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
