import { db } from '../src/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const pubDir = path.join(process.cwd(), 'public/uploads/images');
const distDir = path.join(process.cwd(), 'dist/uploads/images');

async function saveWebpBuffer(buf: Buffer, filenames: string[]) {
  const webp = await sharp(buf).webp({ quality: 90 }).toBuffer();
  for (const fn of filenames) {
    fs.writeFileSync(path.join(pubDir, fn), webp);
    fs.writeFileSync(path.join(distDir, fn), webp);
    console.log(`[RESTORED USER IMAGE] -> ${fn} (${webp.length} bytes)`);
  }
}

async function main() {
  console.log('=== Step 1: Restoring Real User Product Images ===');

  // 1. Fence Birthday Decor (from media_assets med-1790756260505-f1nt or product pro-muccsesu-9ya4)
  const medSnap = await getDoc(doc(db, 'media_assets', 'med-1790756260505-f1nt'));
  let fenceBuf: Buffer | null = null;
  if (medSnap.exists() && medSnap.data()?.url?.startsWith('data:image')) {
    fenceBuf = Buffer.from(medSnap.data().url.split(',')[1], 'base64');
  } else {
    const prodSnap = await getDoc(doc(db, 'products', 'pro-muccsesu-9ya4'));
    if (prodSnap.exists() && prodSnap.data()?.imageUrl?.startsWith('data:image')) {
      fenceBuf = Buffer.from(prodSnap.data().imageUrl.split(',')[1], 'base64');
    }
  }

  if (fenceBuf) {
    await saveWebpBuffer(fenceBuf, [
      'products_pro-muccsesu-9ya4_images_0_munpx31d.webp',
      'products_pro-muccsesu-9ya4_imageUrl_munpx31d.webp'
    ]);
    console.log('Successfully restored real user image for Fence Birthday Decor!');
    // Update product document in Firestore
    await updateDoc(doc(db, 'products', 'pro-muccsesu-9ya4'), {
      imageUrl: '/uploads/images/products_pro-muccsesu-9ya4_images_0_munpx31d.webp',
      images: ['/uploads/images/products_pro-muccsesu-9ya4_images_0_munpx31d.webp'],
      galleryImages: ['/uploads/images/products_pro-muccsesu-9ya4_images_0_munpx31d.webp']
    });
  }

  // 2. ONE light (from media_med-1790062453223-kmjl_url_munq1k13.webp)
  const oneLightSource = path.join(pubDir, 'media_med-1790062453223-kmjl_url_munq1k13.webp');
  if (fs.existsSync(oneLightSource)) {
    const oneLightBuf = fs.readFileSync(oneLightSource);
    await saveWebpBuffer(oneLightBuf, [
      'products_pro-muccx0sb-59ve_images_0_munpx3cx.webp',
      'products_pro-muccx0sb-59ve_imageUrl_munpx3cx.webp'
    ]);
    console.log('Successfully restored real user image for ONE light product!');
    await updateDoc(doc(db, 'products', 'pro-muccx0sb-59ve'), {
      imageUrl: '/uploads/images/products_pro-muccx0sb-59ve_images_0_munpx3cx.webp',
      images: ['/uploads/images/products_pro-muccx0sb-59ve_images_0_munpx3cx.webp'],
      galleryImages: ['/uploads/images/products_pro-muccx0sb-59ve_images_0_munpx3cx.webp']
    });
  }

  // 3. Out Door Bench (from media_med-1790062103009-qgb9_url_munq1jcc.webp)
  const benchSource = path.join(pubDir, 'media_med-1790062103009-qgb9_url_munq1jcc.webp');
  if (fs.existsSync(benchSource)) {
    const benchBuf = fs.readFileSync(benchSource);
    await saveWebpBuffer(benchBuf, [
      'products_pro-mucczl18-cc1s_images_0_munpx3ox.webp',
      'products_pro-mucczl18-cc1s_imageUrl_munpx3ox.webp'
    ]);
    console.log('Successfully restored real user image for Out Door Bench product!');
    await updateDoc(doc(db, 'products', 'pro-mucczl18-cc1s'), {
      imageUrl: '/uploads/images/products_pro-mucczl18-cc1s_images_0_munpx3ox.webp',
      images: ['/uploads/images/products_pro-mucczl18-cc1s_images_0_munpx3ox.webp'],
      galleryImages: ['/uploads/images/products_pro-mucczl18-cc1s_images_0_munpx3ox.webp']
    });
  }

  console.log('\n=== Step 2: Restoring Real Division Vector Logos ===');
  // SWS and U1 division logos should be their official SVGs, not Unsplash photos
  const divUpdates = [
    { id: 'sws', logo: '/assets/images/sws_logo.svg', logoUrl: '/assets/images/sws_logo.svg' },
    { id: 'sws-event-management', logo: '/assets/images/sws_logo.svg', logoUrl: '/assets/images/sws_logo.svg' },
    { id: 'u1', logo: '/assets/images/u1_logo.svg', logoUrl: '/assets/images/u1_logo.svg' },
    { id: 'u1-studio', logo: '/assets/images/u1_logo.svg', logoUrl: '/assets/images/u1_logo.svg' },
    { id: 'it', logo: '/assets/images/it_logo.svg', logoUrl: '/assets/images/it_logo.svg' },
    { id: 'it-solutions', logo: '/assets/images/it_logo.svg', logoUrl: '/assets/images/it_logo.svg' },
    { id: 'mahdev-travels', logo: '/assets/images/travels_logo.svg', logoUrl: '/assets/images/travels_logo.svg' },
    { id: 'travels', logo: '/assets/images/travels_logo.svg', logoUrl: '/assets/images/travels_logo.svg' },
    { id: 'mart', logo: '/assets/images/mart_logo.svg', logoUrl: '/assets/images/mart_logo.svg' },
    { id: 'online-mart', logo: '/assets/images/mart_logo.svg', logoUrl: '/assets/images/mart_logo.svg' },
  ];

  for (const d of divUpdates) {
    try {
      await updateDoc(doc(db, 'divisions', d.id), {
        logo: d.logo,
        logoUrl: d.logoUrl
      });
      console.log(`[DIVISION LOGO FIXED] -> ${d.id} => ${d.logoUrl}`);
    } catch (e: any) {
      console.warn(`Could not update division ${d.id}:`, e.message);
    }
  }

  console.log('\n=== Step 3: Restoring Real User Gallery & Service Images from Dump ===');
  if (fs.existsSync('firestore-dump.json')) {
    const dump = JSON.parse(fs.readFileSync('firestore-dump.json', 'utf8'));

    // 1. Cradle Ceremony Decoration (gal-mtmkxpbi-q1c4 & ser-mtr6myjc-diqc)
    let cradleBuf: Buffer | null = null;
    const cradleGal = dump.gallery?.find((g: any) => g._id === 'gal-mtmkxpbi-q1c4');
    if (cradleGal?.url?.startsWith('data:image')) {
      cradleBuf = Buffer.from(cradleGal.url.split(',')[1], 'base64');
    } else {
      const cradleSer = dump.services?.find((s: any) => s._id === 'ser-mtr6myjc-diqc');
      if (cradleSer?.imageUrl?.startsWith('data:image')) {
        cradleBuf = Buffer.from(cradleSer.imageUrl.split(',')[1], 'base64');
      }
    }
    if (cradleBuf) {
      await saveWebpBuffer(cradleBuf, [
        'gallery_gal-mtmkxpbi-q1c4_url_munpwo73.webp',
        'gallery_gal-mtmkxpbi-q1c4_thumbnailUrl_munpwnxi.webp',
        'services_ser-mtr6myjc-diqc_imageUrl_munpwzrt.webp',
        'services_ser-mtr6myjc-diqc_images_0_munpwzxc.webp',
        'gallery_gal-mugssy3m-jsw8_url_munpwxz6.webp',
        'gallery_gal-mugssy3m-jsw8_mediaUrl_munpwxn8.webp',
        'gallery_gal-mugssy3m-jsw8_thumbnailUrl_munpwy57.webp',
        'gallery_gal-mugssy3m-jsw8_images_0_munpwxsz.webp',
        'gallery_gal-mugsxh47-be4x_url_munpwyv6.webp',
        'gallery_gal-mugsxh47-be4x_mediaUrl_munpwz1j.webp',
        'gallery_gal-mugsxh47-be4x_thumbnailUrl_munpwyiw.webp',
        'gallery_gal-mugsxh47-be4x_images_0_munpwyoy.webp',
      ]);
    }

    // 2. Big Girl Ceremony Decoration (gal-mu0tr4nz-2kyt)
    const bg1 = dump.gallery?.find((g: any) => g._id === 'gal-mu0tr4nz-2kyt');
    if (bg1?.url?.startsWith('data:image')) {
      const buf = Buffer.from(bg1.url.split(',')[1], 'base64');
      await saveWebpBuffer(buf, [
        'gallery_gal-mu0tr4nz-2kyt_url_munpwpd7.webp',
        'gallery_gal-mu0tr4nz-2kyt_mediaUrl_munpwp71.webp',
        'gallery_gal-mu0tr4nz-2kyt_thumbnailUrl_munpwoud.webp',
        'gallery_gal-mu0tr4nz-2kyt_images_0_munpwp0n.webp',
      ]);
    }

    // 3. Big Girl Ceremony (gal-mu0tskl3-vjzo)
    const bg2 = dump.gallery?.find((g: any) => g._id === 'gal-mu0tskl3-vjzo');
    if (bg2?.url?.startsWith('data:image')) {
      const buf = Buffer.from(bg2.url.split(',')[1], 'base64');
      await saveWebpBuffer(buf, [
        'gallery_gal-mu0tskl3-vjzo_url_munpwqa2.webp',
        'gallery_gal-mu0tskl3-vjzo_mediaUrl_munpwpxh.webp',
        'gallery_gal-mu0tskl3-vjzo_thumbnailUrl_munpwq3m.webp',
        'gallery_gal-mu0tskl3-vjzo_images_0_munpwpqx.webp',
      ]);
    }

    // 4. Marry Me Surprise Decoration (gal-mu6zy8zq-pw4v)
    const marry = dump.gallery?.find((g: any) => g._id === 'gal-mu6zy8zq-pw4v');
    if (marry?.url?.startsWith('data:image')) {
      const buf = Buffer.from(marry.url.split(',')[1], 'base64');
      await saveWebpBuffer(buf, [
        'gallery_gal-mu6zy8zq-pw4v_url_munpwr1e.webp',
        'gallery_gal-mu6zy8zq-pw4v_mediaUrl_munpwqww.webp',
        'gallery_gal-mu6zy8zq-pw4v_thumbnailUrl_munpwqsj.webp',
        'gallery_gal-mu6zy8zq-pw4v_images_0_munpwqo1.webp',
      ]);
    }

    // 5. Wedding Decoration (gal-mu6zzx5p-vory & ser-mu71rh63-jxyp)
    let weddBuf: Buffer | null = null;
    const weddGal = dump.gallery?.find((g: any) => g._id === 'gal-mu6zzx5p-vory');
    if (weddGal?.url?.startsWith('data:image')) {
      weddBuf = Buffer.from(weddGal.url.split(',')[1], 'base64');
    } else {
      const weddSer = dump.services?.find((s: any) => s._id === 'ser-mu71rh63-jxyp');
      if (weddSer?.imageUrl?.startsWith('data:image')) {
        weddBuf = Buffer.from(weddSer.imageUrl.split(',')[1], 'base64');
      }
    }
    if (weddBuf) {
      await saveWebpBuffer(weddBuf, [
        'gallery_gal-mu6zzx5p-vory_url_munpwrdr.webp',
        'gallery_gal-mu6zzx5p-vory_thumbnailUrl_munpwrjy.webp',
        'services_ser-mu71rh63-jxyp_imageUrl_munpx0a7.webp',
        'services_ser-mu71rh63-jxyp_images_0_munpx0fc.webp',
        'gallery_gal-mugscead-8nf6_url_munpwwqd.webp',
        'gallery_gal-mugscead-8nf6_mediaUrl_munpwwmc.webp',
        'gallery_gal-mugscead-8nf6_thumbnailUrl_munpwwud.webp',
        'gallery_gal-mugscead-8nf6_images_0_munpwwit.webp',
        'gallery_gal-mugsf9gh-7wo7_url_munpwx47.webp',
        'gallery_gal-mugsf9gh-7wo7_mediaUrl_munpwwzz.webp',
        'gallery_gal-mugsf9gh-7wo7_thumbnailUrl_munpwx7g.webp',
        'gallery_gal-mugsf9gh-7wo7_thumbnailUrl_munpwx9t.webp',
        'gallery_gal-mugsf9gh-7wo7_images_0_munpwwvy.webp',
      ]);
    }

    // 6. Birthday Decoration (ser-mu71u7g1-43hh)
    const bdaySer = dump.services?.find((s: any) => s._id === 'ser-mu71u7g1-43hh');
    if (bdaySer?.imageUrl?.startsWith('data:image')) {
      const buf = Buffer.from(bdaySer.imageUrl.split(',')[1], 'base64');
      await saveWebpBuffer(buf, [
        'services_ser-mu71u7g1-43hh_imageUrl_munpx0ry.webp',
        'services_ser-mu71u7g1-43hh_images_0_munpx0x7.webp',
        'gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
        'gallery_gal-mugs4qz6-4r9o_mediaUrl_munpwurq.webp',
        'gallery_gal-mugs4qz6-4r9o_thumbnailUrl_munpwuwn.webp',
        'gallery_gal-mugs4qz6-4r9o_images_0_munpwun7.webp',
        'gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp',
        'gallery_gal-mugs5uvu-wvbw_mediaUrl_munpwvlf.webp',
        'gallery_gal-mugs5uvu-wvbw_thumbnailUrl_munpwvts.webp',
        'gallery_gal-mugs5uvu-wvbw_images_0_munpwvh0.webp',
      ]);
    }

    // 7. Mini Album & 12 x 36 Album (from real uploaded media asset 12 x 18 Frames)
    const frameSource = path.join(pubDir, 'media_med-1789741214414-era7_url_munq1hq5.webp');
    if (fs.existsSync(frameSource)) {
      const buf = fs.readFileSync(frameSource);
      await saveWebpBuffer(buf, [
        'services_ser-mubdf0vj-4a2e_imageUrl_munpx1aq.webp',
        'services_ser-mubdf0vj-4a2e_images_0_munpx1h9.webp',
        'services_ser-mubdf0vj-4a2e_images_1_munpx1na.webp',
        'services_ser-mubdf0vj-4a2e_images_2_munpx1t0.webp',
        'services_ser-mubdf0vj-4a2e_images_3_munpx1xo.webp',
        'gallery_gal-mubd75a7-iuk0_url_munpws8w.webp',
        'gallery_gal-mubd75a7-iuk0_mediaUrl_munpws1y.webp',
        'gallery_gal-mubd75a7-iuk0_thumbnailUrl_munpwsg5.webp',
        'gallery_gal-mubd75a7-iuk0_images_0_munpwso2.webp',
        'gallery_gal-mubd8ty2-pc2w_url_munpwtln.webp',
        'gallery_gal-mubd8ty2-pc2w_mediaUrl_munpwtf3.webp',
        'gallery_gal-mubd8ty2-pc2w_thumbnailUrl_munpwt8w.webp',
        'gallery_gal-mubd8ty2-pc2w_images_0_munpwt2s.webp',
        'gallery_gal-mubd9nm7-zxgx_url_munpwtyy.webp',
        'gallery_gal-mubd9nm7-zxgx_mediaUrl_munpwtxa.webp',
        'gallery_gal-mubd9nm7-zxgx_thumbnailUrl_munpwtu3.webp',
        'gallery_gal-mubd9nm7-zxgx_images_0_munpwto2.webp',
      ]);
    }
  }

  console.log('\n=== Step 4: Making sure all files in public are mirrored to dist ===');
  const allImages = fs.readdirSync(pubDir);
  for (const f of allImages) {
    fs.copyFileSync(path.join(pubDir, f), path.join(distDir, f));
  }
  console.log(`Mirrored ${allImages.length} images to dist/uploads/images`);
}

main().then(() => {
  console.log('Restoration complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error during restoration:', err);
  process.exit(1);
});
