import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function inspectAll() {
  const colls = ['divisions', 'services', 'products', 'gallery', 'categories', 'settings', 'milestones', 'testimonials', 'portfolio', 'companies', 'media'];
  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    console.log(`=== COLLECTION: ${c} (${snap.size} docs) ===`);
    snap.docs.forEach(d => {
      const data = d.data();
      console.log(`  - [${d.id}]: name=${data.name || data.title || data.id || ''}, division=${data.division || data.divisionId || ''}`);
    });
  }
}
inspectAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
