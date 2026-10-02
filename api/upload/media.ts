import type { IncomingMessage, ServerResponse } from 'http';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      let buffer = Buffer.concat(chunks);
      let mimeType = (req.headers['content-type'] || 'application/octet-stream').toLowerCase();

      // If it's an image (except SVG), optimize and compress to WebP using sharp
      if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
        try {
          const optimizedBuffer = await sharp(buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          buffer = optimizedBuffer;
          mimeType = 'image/webp';
        } catch (sharpErr) {
          console.warn('[UploadMedia API] Sharp optimization warning, continuing with buffer:', sharpErr);
        }
      }

      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          url: dataUri,
          size: buffer.length,
          mimeType,
          message: 'Uploaded and optimized successfully via serverless buffer',
        })
      );
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message || 'Server upload failed' }));
    }
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'active', endpoint: '/api/upload/media' }));
}

