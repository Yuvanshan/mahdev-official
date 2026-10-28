import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { DEFAULT_SITE_ORIGIN, resolveSiteOrigin } from './src/config/site';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const vercelEnvironment = env.VERCEL_ENV || process.env.VERCEL_ENV || 'development';
  // The public domain comes from VITE_SITE_URL (.env files or the Vercel dashboard).
  const siteOrigin = resolveSiteOrigin(env.VITE_SITE_URL || env.PUBLIC_SITE_URL);
  const verificationTags = [
    ['google-site-verification', env.VITE_GOOGLE_SITE_VERIFICATION],
    ['msvalidate.01', env.VITE_BING_SITE_VERIFICATION],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => ({
      name,
      tag: `<meta name="${name}" content="${String(value).replace(/[&<>"]/g, '')}" />`,
    }));

  return {
    define: {
      'import.meta.env.VITE_SITE_DEPLOYMENT_ENV': JSON.stringify(vercelEnvironment),
      // Same resolved origin in the browser bundle as in index.html.
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteOrigin),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'search-engine-verification-tags',
        transformIndexHtml(html) {
          const htmlWithCurrentOrigin = html.replaceAll(
            DEFAULT_SITE_ORIGIN,
            siteOrigin
          );
          const missingVerificationTags = verificationTags
            .filter(({ name }) => !htmlWithCurrentOrigin.toLowerCase().includes(`name="${name}"`))
            .map(({ tag }) => tag)
            .join('\n    ');
          return missingVerificationTags
            ? htmlWithCurrentOrigin.replace('</head>', `${missingVerificationTags}\n  </head>`)
            : htmlWithCurrentOrigin;
        },
      },
      {
        // public/ files are copied as-is, so point their links at the configured domain.
        name: 'site-origin-public-files',
        apply: 'build',
        closeBundle() {
          if (siteOrigin === DEFAULT_SITE_ORIGIN) return;
          for (const file of ['robots.txt', 'llms.txt']) {
            const target = path.resolve(__dirname, 'dist', file);
            if (!existsSync(target)) continue;
            writeFileSync(target, readFileSync(target, 'utf8').replaceAll(DEFAULT_SITE_ORIGIN, siteOrigin));
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('/node_modules/')) return;
            if (id.includes('/node_modules/@firebase/') || id.includes('/node_modules/firebase/')) {
              return 'auth-vendor';
            }
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('/node_modules/motion/') || id.includes('/node_modules/@motionone/')) {
              return 'motion-vendor';
            }
            if (id.includes('/node_modules/lucide-react/')) return 'icons-vendor';
            if (id.includes('/node_modules/@google/genai/')) return 'genai-vendor';
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/sitemap.xml': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
