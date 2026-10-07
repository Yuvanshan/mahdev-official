import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from './legacyFirestoreSource';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const pubDir = path.join(process.cwd(), 'public/uploads/images');
const distDir = path.join(process.cwd(), 'dist/uploads/images');

if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

async function saveWebpBuffer(buffer: Buffer, filename: string, width?: number) {
  let pipeline = sharp(buffer);
  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  const webpBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
  fs.writeFileSync(path.join(pubDir, filename), webpBuffer);
  fs.writeFileSync(path.join(distDir, filename), webpBuffer);
  console.log(`[SAVED REAL ASSET] ${filename} (${webpBuffer.length} bytes)`);
}

async function main() {
  console.log('=== Step 1: Restore User Uploaded Picture for Fence Birthday Decor ===');
  const fenceDocRef = doc(db, 'products', 'pro-muccsesu-9ya4');
  const fenceSnap = await getDoc(fenceDocRef);
  if (fenceSnap.exists()) {
    const data = fenceSnap.data();
    if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
      const base64Data = data.imageUrl.split(',')[1];
      const rawBuf = Buffer.from(base64Data, 'base64');
      const filename = 'products_pro-muccsesu-9ya4_images_0_munpx31d.webp';
      await saveWebpBuffer(rawBuf, filename, 1200);

      // Now update Firestore so imageUrl also points to this real asset
      const cleanUrl = `/uploads/images/${filename}`;
      await updateDoc(fenceDocRef, {
        imageUrl: cleanUrl,
        images: [cleanUrl],
        galleryImages: [cleanUrl],
      });
      console.log('Updated pro-muccsesu-9ya4 in Firestore to real image URL:', cleanUrl);
    }
  }

  console.log('\n=== Step 2: Restore Division Logos to Official Vector SVGs ===');
  const swsRef = doc(db, 'divisions', 'sws');
  const swsMgmtRef = doc(db, 'divisions', 'sws-event-management');
  const u1Ref = doc(db, 'divisions', 'u1');
  const u1StudioRef = doc(db, 'divisions', 'u1-studio');

  await updateDoc(swsRef, {
    logo: '/assets/images/sws_logo.svg',
    logoUrl: '/assets/images/sws_logo.svg',
  });
  console.log('Updated sws logo in Firestore to /assets/images/sws_logo.svg');

  await updateDoc(swsMgmtRef, {
    logo: '/assets/images/sws_logo.svg',
    logoUrl: '/assets/images/sws_logo.svg',
  });
  console.log('Updated sws-event-management logo in Firestore to /assets/images/sws_logo.svg');

  await updateDoc(u1Ref, {
    logo: '/assets/images/u1_logo.svg',
    logoUrl: '/assets/images/u1_logo.svg',
  });
  console.log('Updated u1 logo in Firestore to /assets/images/u1_logo.svg');

  await updateDoc(u1StudioRef, {
    logo: '/assets/images/u1_logo.svg',
    logoUrl: '/assets/images/u1_logo.svg',
  });
  console.log('Updated u1-studio logo in Firestore to /assets/images/u1_logo.svg');

  console.log('\n=== Step 3: Copy Real Event Photos to Overwrite Duplicate Unsplash Files ===');
  // Birthday real photo:
  const realBirthday = path.join(pubDir, 'services_ser-mu71u7g1-43hh_imageUrl_munpx0ry.webp');
  if (fs.existsSync(realBirthday)) {
    const birthdayBuf = fs.readFileSync(realBirthday);
    const birthdayFiles = [
      'gallery_gal-mugs4qz6-4r9o_images_0_munpwun7.webp',
      'gallery_gal-mugs4qz6-4r9o_mediaUrl_munpwurq.webp',
      'gallery_gal-mugs4qz6-4r9o_thumbnailUrl_munpwuwn.webp',
      'gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
      'gallery_gal-mugs5uvu-wvbw_images_0_munpwvh0.webp',
      'gallery_gal-mugs5uvu-wvbw_mediaUrl_munpwvlf.webp',
      'gallery_gal-mugs5uvu-wvbw_thumbnailUrl_munpwvts.webp',
      'gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp',
    ];
    for (const f of birthdayFiles) {
      fs.writeFileSync(path.join(pubDir, f), birthdayBuf);
      fs.writeFileSync(path.join(distDir, f), birthdayBuf);
      console.log(`[OVERWRITTEN WITH REAL PHOTO] ${f}`);
    }
  }

  // Wedding real photo:
  const realWedding = path.join(pubDir, 'gallery_gal-mu6zzx5p-vory_url_munpwrdr.webp');
  if (fs.existsSync(realWedding)) {
    const weddingBuf = fs.readFileSync(realWedding);
    const weddingFiles = [
      'gallery_gal-mugscead-8nf6_images_0_munpwwit.webp',
      'gallery_gal-mugscead-8nf6_mediaUrl_munpwwmc.webp',
      'gallery_gal-mugscead-8nf6_thumbnailUrl_munpwwud.webp',
      'gallery_gal-mugscead-8nf6_url_munpwwqd.webp',
      'gallery_gal-mugsf9gh-7wo7_images_0_munpwwvy.webp',
      'gallery_gal-mugsf9gh-7wo7_mediaUrl_munpwwzz.webp',
      'gallery_gal-mugsf9gh-7wo7_thumbnailUrl_munpwx7g.webp',
      'gallery_gal-mugsf9gh-7wo7_thumbnailUrl_munpwx9t.webp',
      'gallery_gal-mugsf9gh-7wo7_url_munpwx47.webp',
    ];
    for (const f of weddingFiles) {
      fs.writeFileSync(path.join(pubDir, f), weddingBuf);
      fs.writeFileSync(path.join(distDir, f), weddingBuf);
      console.log(`[OVERWRITTEN WITH REAL PHOTO] ${f}`);
    }
  }

  // Cradle ceremony real photo:
  const realCradle = path.join(pubDir, 'gallery_gal-mtmkxpbi-q1c4_url_munpwo73.webp');
  if (fs.existsSync(realCradle)) {
    const cradleBuf = fs.readFileSync(realCradle);
    const cradleFiles = [
      'gallery_gal-mugssy3m-jsw8_images_0_munpwxsz.webp',
      'gallery_gal-mugssy3m-jsw8_mediaUrl_munpwxn8.webp',
      'gallery_gal-mugssy3m-jsw8_thumbnailUrl_munpwy57.webp',
      'gallery_gal-mugssy3m-jsw8_url_munpwxz6.webp',
      'gallery_gal-mugsxh47-be4x_images_0_munpwyoy.webp',
      'gallery_gal-mugsxh47-be4x_mediaUrl_munpwz1j.webp',
      'gallery_gal-mugsxh47-be4x_thumbnailUrl_munpwyiw.webp',
      'gallery_gal-mugsxh47-be4x_url_munpwyv6.webp',
    ];
    for (const f of cradleFiles) {
      fs.writeFileSync(path.join(pubDir, f), cradleBuf);
      fs.writeFileSync(path.join(distDir, f), cradleBuf);
      console.log(`[OVERWRITTEN WITH REAL PHOTO] ${f}`);
    }
  }

  // Also fix any gallery Firestore documents where mediaUrl or url point to non-existent filenames
  const galMubd9 = doc(db, 'gallery', 'gal-mubd9nm7-zxgx');
  await updateDoc(galMubd9, {
    mediaUrl: '/uploads/images/gallery_gal-mubd9nm7-zxgx_url_munpwtyy.webp',
    thumbnailUrl: '/uploads/images/gallery_gal-mubd9nm7-zxgx_url_munpwtyy.webp',
    images: ['/uploads/images/gallery_gal-mubd9nm7-zxgx_url_munpwtyy.webp'],
  });

  const galMugs4 = doc(db, 'gallery', 'gal-mugs4qz6-4r9o');
  await updateDoc(galMugs4, {
    mediaUrl: '/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
    thumbnailUrl: '/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
    images: ['/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp'],
  });

  const galMugs5 = doc(db, 'gallery', 'gal-mugs5uvu-wvbw');
  await updateDoc(galMugs5, {
    mediaUrl: '/uploads/images/gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp',
    thumbnailUrl: '/uploads/images/gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp',
    images: ['/uploads/images/gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp'],
  });

  const galMugscead = doc(db, 'gallery', 'gal-mugscead-8nf6');
  await updateDoc(galMugscead, {
    thumbnailUrl: '/uploads/images/gallery_gal-mugscead-8nf6_url_munpwwqd.webp',
  });

  console.log('\n--- Real User Images Restored and Firestore Synced ---');
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
