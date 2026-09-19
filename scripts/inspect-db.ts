import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
  console.log('--- DETAILED INSPECTION ---');

  // Services
  const srvSnap = await getDocs(collection(db, 'services'));
  console.log('SERVICES count:', srvSnap.size);
  srvSnap.docs.forEach((d) => {
    console.log('Service:', d.id, JSON.stringify(d.data(), null, 2));
  });

  // Gallery
  const galSnap = await getDocs(collection(db, 'gallery'));
  console.log('GALLERY count:', galSnap.size);
  galSnap.docs.forEach((d) => {
    console.log('Gallery:', d.id, JSON.stringify(d.data(), null, 2));
  });

  // Divisions
  const divSnap = await getDocs(collection(db, 'divisions'));
  console.log('DIVISIONS count:', divSnap.size);
  divSnap.docs.forEach((d) => {
    const data = d.data();
    console.log('Division doc:', d.id, 'name:', data.name, 'isComingSoon:', data.isComingSoon, 'status:', data.status, 'hero:', JSON.stringify(data.hero));
  });

  // Settings
  const setSnap = await getDocs(collection(db, 'settings'));
  console.log('SETTINGS count:', setSnap.size);
  setSnap.docs.forEach((d) => {
    console.log('Setting doc:', d.id, JSON.stringify(d.data(), null, 2));
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
