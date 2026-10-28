# Mahdev Pvt Ltd — Vercel Deployment & CI/CD Guide (Phase 31)

This guide documents the end-to-end deployment lifecycle for hosting the **Mahdev Pvt Ltd** enterprise platform on **Vercel** connected directly to **GitHub**.

---

## 1. Overview & Deployment Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   GitHub Repository                    │
│   ├─ main (Production Branch)                          │
│   ├─ development (Staging / Integration Branch)        │
│   └─ feature/* (Pull Request Branches)                 │
└──────────────────────────┬─────────────────────────────┘
                           │ Webhook Trigger
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Vercel CI/CD Engine                  │
│   ├─ Automated Dependency Resolution (`npm install`)   │
│   ├─ TypeScript Verification & Linting                 │
│   └─ Production Bundler (`vite build`)                 │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│   Preview Deployments   │   │  Production Deployment   │
│ (PRs & development br)  │   │  (main branch -> Live)   │
│ *.vercel.app staging    │   │  https://mahdev.lk       │
└─────────────────────────┘   └──────────────────────────┘
```

---

## 2. Vercel Project Configuration

The repository keeps browser code in `src/` and backend implementation in `backend/`. The top-level `api/` directory contains thin Vercel function entrypoints that forward requests to backend handlers. This preserves same-origin routes and HttpOnly login cookies while keeping Turso access server-only.

The project includes a root `vercel.json` configured specifically for modern React + Vite single-page applications:

- **Framework**: `vite`
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x` or `22.x`

### Security & Caching Headers
- **Defense in Depth**: Content Security Policy, Permissions Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Immutable Static Assets**: `Cache-Control: public, max-age=31536000, immutable` for all files in `/assets/`.
- **SPA Fallback**: Clean URL rewrite routing all unmatched routes to `/index.html`.

### API coverage limitation

Vercel deploys files under `api/` as serverless functions; it does not automatically run the Express process in `backend/server.ts`. The `/api` files are deployment adapters for handlers under `backend/api/handlers/`. The deployed functions cover `/api/health`, `/api/database`, `/api/data/{collection}`, `/api/admin/auth/*`, `/api/admin/customers`, and `/api/upload/media`. `/api/data/{collection}` gives each Turso collection a distinct URL while reusing the shared validation, authentication, and persistence logic. Other frontend API paths, including payment, contact, inquiries, Google Reviews sync, and settings, do not have Vercel handlers yet. The catch-all API function returns a JSON 404 for unsupported paths so they cannot silently fall through to the SPA; implement and test a server-side adapter before enabling those flows in production.

The generic database API permits unauthenticated reads only for the website's public collections. Customer profile, order, booking, and payment reads require a verified Firebase ID token and are scoped to the verified UID/email. Customer profile writes are limited to safe profile fields; order/booking creation cannot set paid or completed status. Admin-managed writes require the HttpOnly admin session.

Turso collection tables are initialized once per function instance and cached in memory after provisioning. Subsequent reads and writes reuse the resolved table name rather than issuing `CREATE TABLE IF NOT EXISTS` on every request. This is an instance-local optimization only; Turso remains the source of truth.

The admin notification center watches the latest 250 website inquiries and contact submissions and refreshes those feeds every 2.5 seconds while the admin page is visible. New records update the admin inbox and notification badge; this is near-real-time polling, not a persistent WebSocket connection, so delivery depends on the next successful poll.

The backend schema is provisioned inside the existing Turso database named `mahdev`, not in a newly created database or local JSON files. Every deployment that needs database access must use the same `TURSO_DATABASE_URL` and its matching `TURSO_AUTH_TOKEN`. The application initializes collection tables inside `mahdev`; it never creates Turso databases and rejects remote URLs for other database names. Run `npm run db:migrate` from an environment containing these variables to initialize and verify the schema. Vercel API functions initialize the schema on first request. The optional `migrate:turso` command is only for intentionally importing a selected legacy JSON backup; it is not run during deployment, skips existing document IDs by default, and overwrites matching IDs only when `--overwrite` is explicitly supplied.

---

## 3. Step-by-Step GitHub to Vercel Connection

### Step 1: Import Project into Vercel
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select **Continue with GitHub** and authorize access to your organization or user account.
4. Locate the **mahdev-website** repository and click **Import**.

### Step 2: Configure Project Settings
- **Project Name**: `mahdev-website`
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build` (or default `vite build`)
- **Output Directory**: `dist`

### Step 3: Branch Mapping
- **Production Branch**: `main`
- **Preview Branches**: Any pull request or commit to `development` or `feature/*` automatically generates an isolated, zero-cost Preview URL (e.g., `mahdev-website-git-development-*.vercel.app`).

---

## 4. Environment Variables Configuration Matrix

Configure these variables in **Project Settings > Environment Variables** in Vercel:

| Variable Name | Environments | Description |
| :--- | :--- | :--- |
| `VITE_APP_URL` | Production: `https://mahdev-official.vercel.app`<br>Preview: `https://$VERCEL_URL`<br>Development: `http://localhost:3000` | Public runtime URL for client-side links and analytics; canonical tags use the fixed origin in `src/config/site.ts` |
| `VITE_SITE_URL` | Production: your live domain, e.g. `https://mahdev-official.vercel.app` | The website's public domain for canonical URLs, Open Graph tags, structured data, sitemap, `robots.txt` and `llms.txt`. Must be an origin with no path. Defaults to `https://mahdev-official.vercel.app` when unset. |
| `PUBLIC_SITE_URL` | Optional | Legacy alias for `VITE_SITE_URL`, used only when `VITE_SITE_URL` is unset. |
| `VITE_FIREBASE_API_KEY` | Production, Preview, Development | Public Firebase Web SDK API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production, Preview, Development | `for-her-33ea9.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Production, Preview, Development | `for-her-33ea9` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | `for-her-33ea9.firebasestorage.app` |
| `FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | Server-side Firebase Storage bucket (defaults to `for-her-33ea9.firebasestorage.app`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production, Preview, Development | Server-only Firebase service-account JSON used to create admin-authorized resumable uploads; store as a secret and never prefix with `VITE_` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development | `1062826041810` |
| `VITE_FIREBASE_APP_ID` | Production, Preview, Development | Exact Web App ID copied from Firebase Project Settings for the selected registered app; must belong to `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Production, Preview, Development | `G-MWNCCXGY4F` |
| `VITE_GA_MEASUREMENT_ID` | Production | Optional Google Analytics 4 Measurement ID (`G-...`); unset disables GA4 |
| `VITE_META_PIXEL_ID` | Production | Optional numeric Meta Pixel ID; unset disables Meta Pixel |
| `VITE_GOOGLE_SITE_VERIFICATION` | Production | Optional HTML-tag verification token from Google Search Console |
| `VITE_BING_SITE_VERIFICATION` | Production | Optional HTML-tag verification token from Bing Webmaster Tools |
| `TURSO_DATABASE_URL` | Production, Preview, Development | Server-side connection URL for the existing `mahdev` Turso database (`libsql://mahdev-<organization>.turso.io`) |
| `TURSO_AUTH_TOKEN` | Production, Preview, Development | Server-side Turso auth token; store as a secret |
| `ADMIN_LOGIN_EMAIL` | Production, Preview, Development | Server-side administrator email |
| `ADMIN_LOGIN_PASSWORD_HASH` | Production, Preview, Development | scrypt password hash; generate locally with `npm run admin:hash-password` |
| `ADMIN_SESSION_SECRET` | Production, Preview, Development | Random server-only session signing secret; generate with `openssl rand -base64 48` |
| `VITE_TURSO_DATABASE_NAME` | Production, Preview, Development | Optional public database label for diagnostics |
| `VITE_FIREBASE_RECAPTCHA_SITE_KEY` | Production | reCAPTCHA v3 / Enterprise site key registered for the selected Firebase Web App and allowed production hostname |
| `PAYMENT_GATEWAY_ENV` | Production: `production`<br>Preview/Dev: `sandbox` | Payment verification engine mode |
| `STRIPE_SECRET_KEY` | Production: `sk_live_...`<br>Preview/Dev: `sk_test_...` | Stripe Server Secret API Key |
| `PAYMENT_WEBHOOK_SECRET` | Production, Preview | HMAC-SHA256 signature verification key |
| `ORDER_SIGNATURE_SECRET` | Production, Preview | Authoritative order signing secret |
| `INVOICE_SIGNING_SALT` | Production, Preview | Tamper-proof tax invoice signature salt |
| `GEMINI_API_KEY` | Production, Preview, Development | Gemini AI intelligence secret |

> ⚠️ **Note**: After adding or modifying environment variables in Vercel, you must trigger a redeployment for the changes to take effect.

The live site must use a Firebase Web App ID registered under `for-her-33ea9`. A production App Check verification returned `App not registered` for the currently deployed app ID. Confirm the correct Web App ID in Firebase Project Settings > General, confirm that the reCAPTCHA key is configured for that same app and the production hostname in App Check, update the Vercel Production variables, and redeploy. Do not enable Firebase App Check enforcement until valid tokens are being issued and verified.

### Admin sign-in and database permissions

Admin sign-in uses server-configured credentials, an scrypt password hash, and a signed HttpOnly/SameSite session cookie. Firebase Authentication remains available to customer accounts and Firebase Storage, but is not used for the admin portal.

1. Run `npm run admin:hash-password` in an interactive terminal and enter a new password of at least 12 characters. Do not reuse a password previously shared in chat. The password is not echoed; copy the generated `ADMIN_LOGIN_PASSWORD_HASH` value.
2. In Vercel, set `ADMIN_LOGIN_EMAIL` to the administrator email, `ADMIN_LOGIN_PASSWORD_HASH` to the generated hash, and `ADMIN_SESSION_SECRET` to a random value from `openssl rand -base64 48`.
3. Keep all three values server-only (never prefix them with `VITE_`), then redeploy. Changing the password requires generating and deploying a new hash.
4. Admin database writes, audit reads, admin customer queries, and uploads require the server-issued session cookie. The session expires after eight hours.
5. Keep an environment allowlist entry for at least one bootstrap super administrator. Admin content writes and destructive database actions reject unverified or unauthorized requests; public reads remain available.
6. Admin media uploads and private career CV uploads use the server-side Firebase Admin SDK; Firebase Anonymous Authentication is not used. Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON for the same Firebase project as the configured storage bucket, and grant that account Firebase Storage object create/read/delete permissions. Keep the JSON server-only. If the private key contains newlines, preserve them as `\\n` in the JSON value. A placeholder, truncated JSON, or service account from a different project will make CV submissions fail; redeploy after correcting the secret.
7. Apply the repository's `storage.rules` in Firebase Storage. Website media remains publicly readable, while media writes are restricted to administrators. Admin uploads are sent in bounded chunks through the same-origin, admin-session-protected API, so this upload flow does not depend on bucket CORS.

Admin portal access uses `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` on the server. Do not add these values with a `VITE_` prefix.

---

## 5. Search indexing and analytics

The public sitemap is generated at request time from published CMS pages, active divisions, public services, and published portfolio projects, in addition to the main public routes. It is served from `https://mahdev-official.vercel.app/sitemap.xml` and declared in `robots.txt`. Public marketing pages are indexable; account, admin, and transaction routes are excluded. Individual service pages use service structured data, and division/service listing links use crawlable URLs.

Search indexing is enabled only when Vercel sets `VERCEL_ENV=production`; Vercel preview deployments and local builds remain `noindex`. The `VITE_SITE_URL` environment variable (read by `src/config/site.ts`) is the single source of truth for the public domain: page canonical URLs, sitemap URLs, `robots.txt` and `llms.txt` all follow it. `VITE_APP_URL` is not used to override canonical URLs.

After deploying SEO changes:

1. Verify `https://mahdev-official.vercel.app/robots.txt` and `https://mahdev-official.vercel.app/sitemap.xml` return successfully.
2. Add `https://mahdev-official.vercel.app/` as a URL-prefix property in Google Search Console. The Google HTML-token meta tag and HTML-file verification methods are included in the production build (`/` and `/google557fd5590c618eb4.html`). After deploying, use either HTML verification method in Search Console. The supplied DNS TXT value is `google-site-verification=oDHseI7gVMRQyDiFx63DQwSAKbXVJdR2y6cqBL_Dn0Q`; DNS verification requires control of the domain's DNS zone and cannot be configured on the shared `vercel.app` domain. For Bing, set `VITE_BING_SITE_VERIFICATION` in Vercel Production and redeploy before verification.
3. Submit `https://mahdev-official.vercel.app/sitemap.xml` in both webmaster consoles, then inspect the homepage and key service/career URLs and request indexing where offered. Indexing and ranking are decided by each search engine and cannot be guaranteed.
4. In **Admin > Settings > Company**, enter the full public profile URLs for Facebook, Instagram, LinkedIn, YouTube, TikTok, and WhatsApp. Saved links appear as icons in the global footer and About page; blank or invalid URLs are omitted.
5. If using external analytics, create the GA4 web data stream and/or Meta Pixel, set `VITE_GA_MEASUREMENT_ID` and/or `VITE_META_PIXEL_ID` in the Production Vercel environment, then redeploy. Both are optional and remain disabled when unset; page views, leads, quotes, bookings, checkout starts, purchases, and cart additions are tracked without sending contact details. Tracking respects DNT and GPC.
6. Use complete, accurate service descriptions, prices/quote guidance, features, images, and division assignments. Published services receive individual `/services/{slug}` pages and are included in the sitemap. Publish active divisions and useful CMS case studies; drafts and inactive items are excluded. Do not publish placeholder pages or keyword-only articles.
7. For paid campaigns, add Google Ads and Meta campaign links with `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content` values. First-party page-view records retain these campaign labels, and **Admin > Analytics** reports tagged campaigns and visits referred by search engines. Search Console query, impression, and click metrics require reviewing the verified Search Console account.

---

## 6. Custom Domain Configuration (`mahdev.lk`)

1. In the Vercel Dashboard, go to **Settings > Domains**.
2. Enter `mahdev.lk` and `www.mahdev.lk`.
3. In your DNS provider (Cloudflare, GoDaddy, Namecheap, or LK Domain Registry), add the following DNS records:
   - **Type A**: `@` pointing to `76.76.21.21`
   - **Type CNAME**: `www` pointing to `cname.vercel-dns.com`
4. Vercel will automatically provision a free SSL/TLS certificate via Let's Encrypt.

---

## 7. Pre-Flight Deployment Checklist & Quality Gates

The production pipeline enforces mandatory CI checks before any build is promoted to `main`:

```bash
# Execute local pre-flight checks before pushing PR:
npm run preflight
```

- [x] **Lint & Type Check**: `npm run lint` and `npm run typecheck` pass with zero errors.
- [x] **Automated Test Matrix**: `npm test` passes all 11 automated test suites.
- [x] **Security & Storage Protection**: `npm run test:security` and `npm run test:storage` verified.
- [x] **Disaster Recovery Integrity**: `npm run test:recovery` SHA-256 snapshot drill verified.
- [x] `vercel.json` exists at repository root with correct framework presets and security headers.
- [x] `package.json` contains valid `build` script generating files to `dist/`.
- [x] Client environment variables use the `VITE_` prefix and are defined in `.env.example`.
- [x] No private secrets or API keys are committed to Git.
- [x] All application routes resolve properly with SPA fallback rewrite rules.

---

## 7. Rollback Reference

For detailed instant rollback instructions via the Vercel Dashboard or CLI, refer to [PIPELINE_AND_ROLLBACK.md](./PIPELINE_AND_ROLLBACK.md).

## Changing the website domain

1. Add the new domain to the Vercel project (Settings > Domains) and wait for DNS to verify.
2. In Settings > Environment Variables, set `VITE_SITE_URL` for Production to the new origin, e.g. `https://www.mahdev.lk` (no trailing slash or path).
3. Redeploy production. The value is baked in at build time, so saving the variable alone does not change the live site.
4. Add the new hostname to the Firebase App Check reCAPTCHA key and any OAuth allowed origins.
5. Add the new domain in Google Search Console and submit its `/sitemap.xml`. Redirect the old domain to the new one in Vercel so existing links keep working.
