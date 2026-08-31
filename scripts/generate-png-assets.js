import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generatePngs() {
  const publicDir = path.resolve('public');

  const files = [
    { svg: 'mahdev-logo.svg', png: 'mahdev-logo.png', width: 1200 },
    { svg: 'mahdev-logo-white.svg', png: 'mahdev-logo-white.png', width: 1200 },
    { svg: 'mahdev-symbol.svg', png: 'mahdev-symbol.png', width: 512 },
    { svg: 'mahdev-symbol-white.svg', png: 'mahdev-symbol-white.png', width: 512 },
    { svg: 'favicon.svg', png: 'favicon.png', width: 128, height: 128 },
    { svg: 'favicon.svg', png: 'apple-touch-icon.png', width: 180, height: 180 },
  ];

  for (const item of files) {
    const svgPath = path.join(publicDir, item.svg);
    const pngPath = path.join(publicDir, item.png);
    if (fs.existsSync(svgPath)) {
      const svgBuffer = fs.readFileSync(svgPath);
      let pipeline = sharp(svgBuffer);
      if (item.width && item.height) {
        pipeline = pipeline.resize(item.width, item.height);
      } else if (item.width) {
        pipeline = pipeline.resize({ width: item.width });
      }
      await pipeline.png().toFile(pngPath);
      console.log(`Generated ${item.png} successfully.`);
    }
  }

  // Also create logo.png as alias to mahdev-logo.png
  const logoSvgPath = path.join(publicDir, 'mahdev-logo.svg');
  if (fs.existsSync(logoSvgPath)) {
    await sharp(fs.readFileSync(logoSvgPath))
      .resize({ width: 1200 })
      .png()
      .toFile(path.join(publicDir, 'logo.png'));
    console.log('Generated logo.png successfully.');
  }
}

generatePngs().catch(console.error);
