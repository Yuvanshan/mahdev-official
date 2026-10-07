import { db } from './legacyFirestoreSource';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function fix() {
  console.log('=== Step 1: Copying real Fence picture to Fence product files ===');
  const pubDir = path.join(process.cwd(), 'public/uploads/images');
  const distDir = path.join(process.cwd(), 'dist/uploads/images');

  // Source for Fence Birthday Decor: media_med-1790062331397-f7ku_url_munq1jpd.webp (658868)
  const fenceSource = path.join(pubDir, 'media_med-1790062331397-f7ku_url_munq1jpd.webp');
  if (fs.existsSync(fenceSource)) {
    const fenceBuf = fs.readFileSync(fenceSource);
    const targets = [
      'products_pro-muccsesu-9ya4_imageUrl_munpx31d.webp',
      'products_pro-muccsesu-9ya4_images_0_munpx31d.webp'
    ];
    for (const t of targets) {
      fs.writeFileSync(path.join(pubDir, t), fenceBuf);
      fs.writeFileSync(path.join(distDir, t), fenceBuf);
      console.log(`Updated ${t} with real Fence picture!`);
    }
  }

  console.log('=== Step 2: Cleaning duplicate divisions in Firestore ===');
  // Canonical division IDs are: sws, u1, it, travels, mart
  // Redundant alias documents in Firestore: sws-event-management, u1-studio, it-solutions, mahdev-travels, online-mart
  const duplicateDivs = ['sws-event-management', 'u1-studio', 'it-solutions', 'mahdev-travels', 'online-mart'];
  for (const dupId of duplicateDivs) {
    try {
      await deleteDoc(doc(db, 'divisions', dupId));
      console.log(`Deleted duplicate division document: ${dupId}`);
    } catch (e: any) {
      console.warn(`Could not delete ${dupId}:`, e.message);
    }
  }

  // Ensure the 5 canonical divisions have their clean routes & logos
  const canonicalFixes = [
    { id: 'sws', logoUrl: '/assets/images/sws_logo.svg', logo: '/assets/images/sws_logo.svg', route: '/sws', slug: 'sws' },
    { id: 'u1', logoUrl: '/assets/images/u1_logo.svg', logo: '/assets/images/u1_logo.svg', route: '/u1', slug: 'u1' },
    { id: 'it', logoUrl: '/assets/images/it_logo.svg', logo: '/assets/images/it_logo.svg', route: '/it', slug: 'it' },
    { id: 'travels', logoUrl: '/assets/images/travels_logo.svg', logo: '/assets/images/travels_logo.svg', route: '/travels', slug: 'travels' },
    { id: 'mart', logoUrl: '/assets/images/mart_logo.svg', logo: '/assets/images/mart_logo.svg', route: '/mart', slug: 'mart' },
  ];
  for (const c of canonicalFixes) {
    try {
      await updateDoc(doc(db, 'divisions', c.id), c);
      console.log(`Updated canonical division ${c.id}`);
    } catch (e: any) {
      console.warn(`Could not update ${c.id}:`, e.message);
    }
  }

  console.log('=== Step 3: Removing duplicate gallery items in Firestore ===');
  // Duplicate gallery items that were added as mock clones:
  // gal-mugscead-8nf6 and gal-mugsf9gh-7wo7 (duplicates of Wedding Decoration gal-mu6zzx5p-vory)
  // gal-mugssy3m-jsw8 and gal-mugsxh47-be4x (duplicates of Cradle Ceremony gal-mtmkxpbi-q1c4)
  // gal-mugs5uvu-wvbw (duplicate of Birthday Decoration gal-mugs4qz6-4r9o)
  // gal-mubd9nm7-zxgx (duplicate of Mini Album gal-mubd8ty2-pc2w)
  const duplicateGalleryIds = [
    'gal-mugscead-8nf6',
    'gal-mugsf9gh-7wo7',
    'gal-mugssy3m-jsw8',
    'gal-mugsxh47-be4x',
    'gal-mugs5uvu-wvbw',
    'gal-mubd9nm7-zxgx',
  ];
  for (const galId of duplicateGalleryIds) {
    try {
      await deleteDoc(doc(db, 'gallery', galId));
      console.log(`Deleted duplicate gallery document: ${galId}`);
    } catch (e: any) {
      console.warn(`Could not delete gallery item ${galId}:`, e.message);
    }
  }

  console.log('=== Finished cleanup ===');
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
