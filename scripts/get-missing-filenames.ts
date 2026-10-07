import { db } from './legacyFirestoreSource';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const colls = ['gallery', 'services', 'products', 'settings', 'divisions'];
  const missingFiles: { collection: string; docId: string; field: string; filename: string; title: string; category?: string }[] = [];

  for (const c of colls) {
    const snap = await getDocs(collection(db, c));
    snap.forEach(d => {
      const data = d.data();
      const title = data.title || data.name || d.id;
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string' && v.startsWith('/uploads/images/')) {
          const fn = path.basename(v);
          const pubExists = fs.existsSync(path.join(process.cwd(), 'public/uploads/images', fn));
          const distExists = fs.existsSync(path.join(process.cwd(), 'dist/uploads/images', fn));
          if (!pubExists && !distExists) {
            missingFiles.push({ collection: c, docId: d.id, field: k, filename: fn, title, category: data.category || data.tag });
          }
        } else if (Array.isArray(v)) {
          v.forEach((item, idx) => {
            if (typeof item === 'string' && item.startsWith('/uploads/images/')) {
              const fn = path.basename(item);
              const pubExists = fs.existsSync(path.join(process.cwd(), 'public/uploads/images', fn));
              const distExists = fs.existsSync(path.join(process.cwd(), 'dist/uploads/images', fn));
              if (!pubExists && !distExists) {
                missingFiles.push({ collection: c, docId: d.id, field: `${k}[${idx}]`, filename: fn, title, category: data.category || data.tag });
              }
            }
          });
        }
      }
    });
  }

  console.log(`TOTAL MISSING FILES: ${missingFiles.length}`);
  console.log(JSON.stringify(missingFiles, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
