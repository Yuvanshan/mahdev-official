import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const colls = ['gallery', 'services', 'products', 'divisions', 'settings'];
  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    console.log(`\n=================== COLLECTION: ${c} (${snap.size} items) ===================`);
    snap.forEach(d => {
      const data = d.data();
      const name = data.title || data.name || data.id || d.id;
      const imagesInfo: string[] = [];

      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') {
          if (v.startsWith('data:image')) {
            imagesInfo.push(`${k}: [INLINE BASE64 len=${v.length}]`);
          } else if (v.startsWith('/uploads/')) {
            const exists = fs.existsSync(path.join(process.cwd(), 'public', v));
            imagesInfo.push(`${k}: [/uploads exists=${exists}] ${v}`);
          } else if (v.startsWith('http')) {
            imagesInfo.push(`${k}: [HTTP] ${v.substring(0, 60)}`);
          } else if (v.startsWith('/assets/')) {
            imagesInfo.push(`${k}: [/assets] ${v}`);
          }
        } else if (Array.isArray(v) && v.length > 0) {
          v.forEach((el, idx) => {
            if (typeof el === 'string') {
              if (el.startsWith('data:image')) {
                imagesInfo.push(`${k}[${idx}]: [INLINE BASE64 len=${el.length}]`);
              } else if (el.startsWith('/uploads/')) {
                const exists = fs.existsSync(path.join(process.cwd(), 'public', el));
                imagesInfo.push(`${k}[${idx}]: [/uploads exists=${exists}] ${el}`);
              } else if (el.startsWith('http')) {
                imagesInfo.push(`${k}[${idx}]: [HTTP] ${el.substring(0, 60)}`);
              }
            }
          });
        }
      }
      console.log(`[${d.id}] "${name}" -> ${imagesInfo.join(' | ')}`);
    });
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
