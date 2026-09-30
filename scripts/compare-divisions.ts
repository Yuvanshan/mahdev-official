import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function comparePairs() {
  const pairs = [
    ['sws', 'sws-event-management'],
    ['u1', 'u1-studio'],
    ['it', 'it-solutions'],
    ['travels', 'mahdev-travels'],
    ['mart', 'online-mart'],
  ];
  for (const [a, b] of pairs) {
    const snapA = await getDoc(doc(db, 'divisions', a));
    const snapB = await getDoc(doc(db, 'divisions', b));
    console.log(`=== PAIR: ${a} vs ${b} ===`);
    console.log(a + ' data: ' + JSON.stringify(snapA.data(), null, 2));
    console.log(b + ' data: ' + JSON.stringify(snapB.data(), null, 2));
  }
}
comparePairs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
