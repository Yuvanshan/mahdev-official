import fs from 'fs';

const data = JSON.parse(fs.readFileSync('firestore-dump.json', 'utf8'));

for (const coll of Object.keys(data)) {
  console.log(`\n================ Collection: ${coll} ================`);
  const items = Array.isArray(data[coll]) ? data[coll] : Object.values(data[coll]);
  items.forEach((item: any) => {
    console.log(`Doc [${item.id || item._id}]: ${item.title || item.name}`);
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'string') {
        if (v.startsWith('data:image')) {
          console.log(`   ${k}: [BASE64 length=${v.length}]`);
        } else if (v.startsWith('http') || v.startsWith('/')) {
          console.log(`   ${k}: ${v.substring(0, 80)}`);
        }
      } else if (Array.isArray(v) && v.length > 0) {
        v.forEach((el, i) => {
          if (typeof el === 'string') {
            if (el.startsWith('data:image')) {
              console.log(`   ${k}[${i}]: [BASE64 length=${el.length}]`);
            } else if (el.startsWith('http') || el.startsWith('/')) {
              console.log(`   ${k}[${i}]: ${el.substring(0, 80)}`);
            }
          }
        });
      }
    }
  });
}
