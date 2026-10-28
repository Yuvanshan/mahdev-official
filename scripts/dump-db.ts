import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import { getFirebaseConfig } from './firebaseConfig';

const { firebaseConfig, firestoreDatabaseId } = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firestoreDatabaseId);

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
