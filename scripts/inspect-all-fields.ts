import { db } from './legacyFirestoreSource';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  const colls = ['gallery', 'services', 'products', 'divisions'];
  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    console.log(`\n=================== ${c} ===================`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`\nDoc ID: ${d.id}`);
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') {
          if (v.startsWith('data:image')) {
            console.log(`  ${k}: [BASE64 len=${v.length}] starts: ${v.substring(0, 30)}`);
          } else {
            console.log(`  ${k}: ${v}`);
          }
        } else if (Array.isArray(v)) {
          console.log(`  ${k}: (Array len=${v.length})`);
          v.forEach((el, idx) => {
            if (typeof el === 'string' && el.startsWith('data:image')) {
              console.log(`     [${idx}]: [BASE64 len=${el.length}]`);
            } else {
              console.log(`     [${idx}]: ${el}`);
            }
          });
        }
      }
    });
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
