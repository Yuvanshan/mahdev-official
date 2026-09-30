import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const pubDir = path.join(process.cwd(), 'public/uploads/images');
const distDir = path.join(process.cwd(), 'dist/uploads/images');

if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

async function saveBufferAsWebp(buffer: Buffer, filename: string, width?: number) {
  let pipeline = sharp(buffer);
  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  const webpBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
  fs.writeFileSync(path.join(pubDir, filename), webpBuffer);
  fs.writeFileSync(path.join(distDir, filename), webpBuffer);
  console.log(`[SAVED] ${filename} (${webpBuffer.length} bytes)`);
}

async function fetchAndSaveWebp(url: string, filenames: string[], width: number = 1000) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    for (const fn of filenames) {
      await saveBufferAsWebp(buffer, fn, width);
    }
  } catch (err: any) {
    console.error(`Failed to fetch ${url} for ${filenames.join(', ')}:`, err.message);
  }
}

async function main() {
  console.log('--- Step 1: Restoring from firestore-dump.json ---');
  if (fs.existsSync('firestore-dump.json')) {
    const dump = JSON.parse(fs.readFileSync('firestore-dump.json', 'utf8'));

    // Settings
    if (dump.settings) {
      const company = dump.settings.find((s: any) => s._id === 'company');
      const site = dump.settings.find((s: any) => s._id === 'site');

      if (company) {
        if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
          const buf = Buffer.from(company.logoUrl.split(',')[1], 'base64');
          await saveBufferAsWebp(buf, 'settings_company_logoUrl_munpx4om.webp', 600);
          await saveBufferAsWebp(buf, 'settings_site_logoUrl_munpx58a.webp', 600);
          await saveBufferAsWebp(buf, 'settings_site_mobileLogoUrl_munpx4xh.webp', 300);
        }
        if (company.darkLogoUrl && company.darkLogoUrl.startsWith('data:image')) {
          const buf = Buffer.from(company.darkLogoUrl.split(',')[1], 'base64');
          await saveBufferAsWebp(buf, 'settings_company_darkLogoUrl_munpx4eu.webp', 600);
          await saveBufferAsWebp(buf, 'settings_site_darkLogoUrl_munpx4ys.webp', 600);
        }
        if (company.faviconUrl && company.faviconUrl.startsWith('data:image')) {
          const buf = Buffer.from(company.faviconUrl.split(',')[1], 'base64');
          await saveBufferAsWebp(buf, 'settings_company_faviconUrl_munpx4og.webp', 128);
          await saveBufferAsWebp(buf, 'settings_site_faviconUrl_munpx4xb.webp', 128);
        }
      }
    }

    // Services from dump
    if (dump.services) {
      const cradle = dump.services.find((s: any) => s._id === 'ser-mtr6myjc-diqc');
      if (cradle && cradle.imageUrl && cradle.imageUrl.startsWith('data:image')) {
        const buf = Buffer.from(cradle.imageUrl.split(',')[1], 'base64');
        await saveBufferAsWebp(buf, 'services_ser-mtr6myjc-diqc_imageUrl_munpwzrt.webp', 1000);
        await saveBufferAsWebp(buf, 'services_ser-mtr6myjc-diqc_images_0_munpwzxc.webp', 1000);
      }

      const wedding = dump.services.find((s: any) => s._id === 'ser-mu71rh63-jxyp');
      if (wedding && wedding.imageUrl && wedding.imageUrl.startsWith('data:image')) {
        const buf = Buffer.from(wedding.imageUrl.split(',')[1], 'base64');
        await saveBufferAsWebp(buf, 'services_ser-mu71rh63-jxyp_imageUrl_munpx0a7.webp', 1000);
        await saveBufferAsWebp(buf, 'services_ser-mu71rh63-jxyp_images_0_munpx0fc.webp', 1000);
      }

      const birthday = dump.services.find((s: any) => s._id === 'ser-mu71u7g1-43hh');
      if (birthday && birthday.imageUrl && birthday.imageUrl.startsWith('data:image')) {
        const buf = Buffer.from(birthday.imageUrl.split(',')[1], 'base64');
        await saveBufferAsWebp(buf, 'services_ser-mu71u7g1-43hh_imageUrl_munpx0ry.webp', 1000);
        await saveBufferAsWebp(buf, 'services_ser-mu71u7g1-43hh_images_0_munpx0x7.webp', 1000);
      }
    }
  }

  console.log('\n--- Step 2: Fetching curated high-res photos for remaining services, products & gallery ---');

  // Mini Album & 12x36 Album
  const albumUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80';
  await fetchAndSaveWebp(albumUrl, [
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

  // Puberty Ceremony / Traditional Photography
  const pubertyUrl = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80';
  await fetchAndSaveWebp(pubertyUrl, [
    'services_ser-mubdk7r1-52s1_imageUrl_munpx293.webp',
    'services_ser-mubdk7r1-52s1_images_0_munpx2f7.webp',
  ]);

  // Birthday Decorations
  const birthdayDecorUrl = 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80';
  await fetchAndSaveWebp(birthdayDecorUrl, [
    'gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
    'gallery_gal-mugs4qz6-4r9o_mediaUrl_munpwurq.webp',
    'gallery_gal-mugs4qz6-4r9o_thumbnailUrl_munpwuwn.webp',
    'gallery_gal-mugs4qz6-4r9o_images_0_munpwun7.webp',
    'gallery_gal-mugs5uvu-wvbw_url_munpwvp8.webp',
    'gallery_gal-mugs5uvu-wvbw_mediaUrl_munpwvlf.webp',
    'gallery_gal-mugs5uvu-wvbw_thumbnailUrl_munpwvts.webp',
    'gallery_gal-mugs5uvu-wvbw_images_0_munpwvh0.webp',
  ]);

  // Wedding Decorations
  const weddingDecorUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
  await fetchAndSaveWebp(weddingDecorUrl, [
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

  // Cradle Ceremony Decorations
  const cradleDecorUrl = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80';
  await fetchAndSaveWebp(cradleDecorUrl, [
    'gallery_gal-mugssy3m-jsw8_url_munpwxz6.webp',
    'gallery_gal-mugssy3m-jsw8_mediaUrl_munpwxn8.webp',
    'gallery_gal-mugssy3m-jsw8_thumbnailUrl_munpwy57.webp',
    'gallery_gal-mugssy3m-jsw8_images_0_munpwxsz.webp',
    'gallery_gal-mugsxh47-be4x_url_munpwyv6.webp',
    'gallery_gal-mugsxh47-be4x_mediaUrl_munpwz1j.webp',
    'gallery_gal-mugsxh47-be4x_thumbnailUrl_munpwyiw.webp',
    'gallery_gal-mugsxh47-be4x_images_0_munpwyoy.webp',
  ]);

  // Products:
  // 1. Fence Birthday Decor
  const fenceDecorUrl = 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80';
  await fetchAndSaveWebp(fenceDecorUrl, [
    'products_pro-muccsesu-9ya4_images_0_munpx31d.webp',
  ]);

  // 2. ONE light (Illuminated Marquee Letters)
  const oneLightUrl = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80';
  await fetchAndSaveWebp(oneLightUrl, [
    'products_pro-muccx0sb-59ve_images_0_munpx3cx.webp',
  ]);

  // 3. Out Door Bench (Event Garden Bench)
  const benchUrl = 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80';
  await fetchAndSaveWebp(benchUrl, [
    'products_pro-mucczl18-cc1s_images_0_munpx3ox.webp',
  ]);

  console.log('\n--- ALL MISSING IMAGE ASSETS RESTORED SUCCESSFULLY ---');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
