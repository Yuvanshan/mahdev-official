import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const colls = ['gallery', 'services', 'products', 'divisions', 'milestones', 'settings', 'categories', 'media'];
  
  for (const c of colls) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`\n================ ${c} (${snap.size} docs in Firestore) ================`);
      snap.forEach(d => {
        const data = d.data();
        const label = data.title || data.name || data.id || d.id;
        console.log(`\nDoc [${d.id}]: ${label}`);
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string') {
            if (v.startsWith('http://') || v.startsWith('https://')) {
              console.log(`   ${k}: [HTTP] ${v.substring(0, 80)}`);
            } else if (v.startsWith('data:')) {
              console.log(`   ${k}: [DATA-URL len=${v.length}] ${v.substring(0, 35)}...`);
            } else if (v.startsWith('/uploads/')) {
              const pubExists = fs.existsSync(path.join(process.cwd(), 'public', v));
              const distExists = fs.existsSync(path.join(process.cwd(), 'dist', v));
              const exists = pubExists || distExists;
              console.log(`   ${k}: [${exists ? 'FILE-EXISTS' : 'FILE-MISSING-404'}] ${v}`);
            } else if (v.startsWith('/assets/') || v.startsWith('/')) {
              const pubExists = fs.existsSync(path.join(process.cwd(), 'public', v));
              console.log(`   ${k}: [${pubExists ? 'ASSET-EXISTS' : 'ASSET-CHECK'}] ${v}`);
            }
          } else if (Array.isArray(v) && v.length > 0) {
            v.forEach((item, idx) => {
              if (typeof item === 'string' && item.startsWith('/uploads/')) {
                const pubExists = fs.existsSync(path.join(process.cwd(), 'public', item));
                console.log(`   ${k}[${idx}]: [${pubExists ? 'FILE-EXISTS' : 'FILE-MISSING-404'}] ${item}`);
              }
            });
          }
        }
      });
    } catch (e: any) {
      console.log(`Error reading collection ${c}: ${e.message}`);
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
