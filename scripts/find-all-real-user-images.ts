import { db } from './legacyFirestoreSource';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import sharp from 'sharp';

async function main() {
  const colls = ['gallery', 'services', 'products', 'divisions', 'settings', 'portfolio', 'categories', 'media', 'banners', 'testimonials', 'users'];
  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    for (const d of snap.docs) {
      const data = d.data();
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') {
          if (v.startsWith('data:image')) {
            console.log(`[REAL USER BASE64] Collection: ${c} | Doc: ${d.id} | Field: ${k} | Length: ${v.length}`);
          }
        } else if (Array.isArray(v)) {
          v.forEach((item, idx) => {
            if (typeof item === 'string' && item.startsWith('data:image')) {
              console.log(`[REAL USER BASE64] Collection: ${c} | Doc: ${d.id} | Field: ${k}[${idx}] | Length: ${item.length}`);
            }
          });
        }
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
