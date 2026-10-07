import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);
