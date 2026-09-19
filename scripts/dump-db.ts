import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import rawConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
  appId: rawConfig.appId,
};

const databaseId = rawConfig.firestoreDatabaseId || 'mahdev-pvt-ldt';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, databaseId);

async function main() {
  const result: any = {};

  const collections = ['divisions', 'services', 'gallery', 'settings', 'categories'];
  for (const c of collections) {
    const snap = await getDocs(collection(db, c));
    result[c] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  }

  fs.writeFileSync('firestore-dump.json', JSON.stringify(result, null, 2));
  console.log('Successfully wrote firestore-dump.json');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
