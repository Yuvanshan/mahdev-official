import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import rawConfig from '../firebase-applet-config.json';

const app = initializeApp(rawConfig);

const dbsToCheck = [
  { name: 'default', id: undefined },
  { name: 'mahdev-pvt-ldt', id: 'mahdev-pvt-ldt' },
  { name: 'ai-studio-mahdevpvtltd-b6505c20-1d3d-4de0-a4bb-a8fb7ae999dd', id: 'ai-studio-mahdevpvtltd-b6505c20-1d3d-4de0-a4bb-a8fb7ae999dd' }
];

async function check() {
  for (const item of dbsToCheck) {
    console.log('=== Checking DB: ' + item.name + ' ===');
    try {
      const db = item.id ? getFirestore(app, item.id) : getFirestore(app);
      for (const coll of ['gallery', 'services', 'products', 'divisions']) {
        try {
          const snap = await getDocs(collection(db, coll));
          console.log('  ' + coll + ': ' + snap.size + ' docs');
          if (snap.size > 0) {
            console.log('    sample titles: ' + snap.docs.slice(0, 5).map(d => d.data().title || d.data().name || d.id).join(', '));
          }
        } catch (e: any) {
          console.log('  ' + coll + ' error: ' + (e.code || e.message));
        }
      }
    } catch (err: any) {
      console.log('  DB error: ' + (err.code || err.message));
    }
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
