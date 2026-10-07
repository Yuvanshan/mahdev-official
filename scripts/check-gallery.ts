import { db } from './legacyFirestoreSource';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function checkGallery() {
  const snap = await getDocs(collection(db, 'gallery'));
  console.log('Total gallery items:', snap.size);
  snap.forEach(d => {
    const data = d.data();
    const url = data.url || data.mediaUrl || data.thumbnailUrl;
    let status = 'NO_URL';
    if (url) {
      if (url.startsWith('/uploads/')) {
        const pub = fs.existsSync(path.join(process.cwd(), 'public', url));
        const dist = fs.existsSync(path.join(process.cwd(), 'dist', url));
        status = (pub || dist) ? 'EXISTS' : 'MISSING_FILE';
      } else {
        status = url.startsWith('http') ? 'HTTP' : 'OTHER';
      }
    }
    console.log(`[${d.id}] ${data.title}: ${status} -> ${url}`);
  });
}

checkGallery().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
