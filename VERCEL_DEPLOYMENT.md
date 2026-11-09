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

The repository keeps browser code and static assets in `frontend/` and backend implementation in `backend/`. The top-level `api/` directory contains thin Vercel function entrypoints that forward requests to backend handlers. This preserves same-origin routes and HttpOnly login cookies while keeping Turso access server-only.

The project includes a root `vercel.json` configured specifically for modern React + Vite single-page applications. Frontend and Express backend build commands are separate (`npm run build:frontend` and `npm run build:backend`); `npm run build` runs both. GitHub Actions validates these independently and gates production deployment on both. Before deployment, run `npm run typecheck` and `npm run build`.

- **Framework**: `vite`
- **Build Command**: `npm run build:frontend` (from `vercel.json`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x` or `22.x`

### Security & Caching Headers
- **Defense in Depth**: Content Security Policy, Permissions Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Immutable Static Assets**: `Cache-Control: public, max-age=31536000, immutable` for all files in `/assets/`.
- **SPA fallback**: Unmatched page requests use the server-side page-shell handler for route status and SEO metadata. Recognized division hosts also route extensionless pages through this handler so crawlers receive host- and page-specific metadata before JavaScript runs; API, static asset, and admin portal paths are excluded.

### API coverage limitation

Vercel deploys files under `api/` as serverless functions; it does not automatically run the Express process in `backend/server.ts`. The `/api` files are deployment adapters for handlers under `backend/api/handlers/`. The deployed functions cover `/api/health`, `/api/database`, `/api/data/{collection}`, `/api/admin/auth/*`, `/api/admin/customers`, and `/api/upload/media`. `/api/data/{collection}` gives each Turso collection a distinct URL while reusing the shared validation, authentication, and persistence logic. Other frontend API paths, including payment, contact, inquiries, Google Reviews sync, and settings, do not have Vercel handlers yet. The catch-all API function returns a JSON 404 for unsupported paths so they cannot silently fall through to the SPA; implement and test a server-side adapter before enabling those flows in production.

The generic database API permits unauthenticated reads only for the website's public collections. Customer profile, order, booking, and payment reads require a verified Firebase ID token and are scoped to the verified UID/email. Customer profile writes are limited to safe profile fields; order/booking creation cannot set paid or completed status. Admin-managed writes require the HttpOnly admin session.

Turso collection tables are initialized once per function instance and cached in memory after provisioning. Subsequent reads and writes reuse the resolved table name rather than issuing `CREATE TABLE IF NOT EXISTS` on every request. This is an instance-local optimization only; Turso remains the source of truth.

The admin notification center watches the latest 250 website inquiries and contact submissions and refreshes those feeds every 2.5 seconds while the admin page is visible. New records update the admin inbox and notification badge; this is near-real-time polling, not a persistent WebSocket connection, so delivery depends on the next successful poll.

The backend schema is provisioned inside the existing Turso database selected by `TURSO_DATABASE_NAME`; no deployment creates a new database. Every deployment that needs database access must use the same `TURSO_DATABASE_URL`, its matching `TURSO_AUTH_TOKEN`, and the configured database name. The application initializes collection tables inside that database and rejects URLs for other database names. Run `npm run db:migrate` from an environment containing these variables to initialize and verify the schema. Vercel API functions initialize the schema on first request. The optional `migrate:turso` command is only for intentionally importing a selected legacy JSON backup; it is not run during deployment, skips existing document IDs by default, and overwrites matching IDs only when `--overwrite` is explicitly supplied.

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
| `VITE_SWS_SITE_URL` | Production only | SWS origin. Temporary: `https://sws-events.vercel.app`; later: `https://sws.mahdev.lk`. |
| `VITE_U1_SITE_URL` | Production only | U1 Studio origin. Temporary: `https://u1-studio.vercel.app`; later: `https://u1.mahdev.lk`. |
| `VITE_IT_SITE_URL` | Production only | Mahdev IT origin. Temporary: `https://mahdev-it.vercel.app`; later: `https://it.mahdev.lk`. |
| `VITE_TRAVELS_SITE_URL` | Production only | Mahdev Travels origin. Temporary: `https://mahdev-travels.vercel.app`; later: `https://travels.mahdev.lk`. |
| `VITE_MART_SITE_URL` | Production only | Mahdev Mart origin. Temporary: `https://mahdev-mart.vercel.app`; later: `https://mart.mahdev.lk`. |
| `PUBLIC_SITE_URL` | Optional | Legacy alias for `VITE_SITE_URL`, used only when `VITE_SITE_URL` is unset. |
| `VITE_FIREBASE_API_KEY` | Production, Preview, Development | Public Firebase Web SDK API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production, Preview, Development | Firebase Console Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Production, Preview, Development | Firebase Console project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | Firebase Console storage bucket |
| `FIREBASE_PROJECT_ID` | Production, Preview, Development | Server-side project ID for token validation; same project as the client config |
| `FIREBASE_AUTH_DOMAIN` | Production, Preview, Development | Server-side Firebase Auth domain for the same-origin auth proxy |
| `FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | Server-side Firebase Admin Storage bucket |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production, Preview, Development | Server-only Firebase service-account JSON used to create admin-authorized resumable uploads; store as a secret and never prefix with `VITE_` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development | `1062826041810` |
| `VITE_FIREBASE_APP_ID` | Production, Preview, Development | Exact Web App ID copied from Firebase Project Settings for the selected registered app; must belong to `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Production, Preview, Development | `G-MWNCCXGY4F` |
| `VITE_GA_MEASUREMENT_ID` | Production | Optional Google Analytics 4 Measurement ID (`G-...`); unset disables GA4 |
| `VITE_GTM_CONTAINER_ID` | Production | Google Tag Manager container ID (`GTM-...`) |
| `VITE_META_PIXEL_ID` | Production | Optional numeric Meta Pixel ID; unset disables Meta Pixel |
| `VITE_GOOGLE_SITE_VERIFICATION` | Production | Optional HTML-tag verification token from Google Search Console |
| `VITE_BING_SITE_VERIFICATION` | Production | Optional HTML-tag verification token from Bing Webmaster Tools |
| `TURSO_DATABASE_URL` | Production, Preview, Development | Server-side connection URL for the existing Turso database |
| `TURSO_AUTH_TOKEN` | Production, Preview, Development | Server-side Turso auth token; store as a secret |
| `TURSO_DATABASE_NAME` | Production, Preview, Development | Exact existing Turso database name matched against the URL; set the same value in each environment |
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

Use values from the same Firebase project for all `VITE_FIREBASE_*` variables, `FIREBASE_PROJECT_ID`, `FIREBASE_AUTH_DOMAIN`, and `FIREBASE_STORAGE_BUCKET`. Confirm the Web App ID is registered in Firebase Project Settings > General and that the reCAPTCHA key is configured for that app and production hostname in App Check. Do not enable Firebase App Check enforcement until valid tokens are being issued and verified.

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

`/sitemap.xml` and `/robots.txt` remain public URLs, served by request-time endpoints. Do not add static copies under `public/`: Vercel can serve static files before rewrites, which would bypass host-specific responses. Each host gets a sitemap containing only canonical URLs on that same host, avoiding cross-host sitemap entries. It includes public site routes and published CMS pages, services, products, galleries/media, projects, active divisions, and career openings, plus available page-associated images using Google's Image sitemap extension. Draft, deleted, private, account, admin, and transaction routes are excluded. Every host's `robots.txt` points to its own sitemap. Verify and submit each corporate/division host in Search Console and Bing Webmaster Tools.

Each division host also uses its own division logo for browser favicons, Apple touch icons, and the web app manifest; the corporate host keeps the Mahdev company icons.

All division hosts are attached to this same Vercel project. Keep the division URL variables **unset for Preview** so preview builds cannot send users or crawlers to production hosts. The values are public build-time origins and saving them requires a production redeployment.

Search indexing is enabled only when Vercel sets `VERCEL_ENV=production`; Vercel preview deployments and local builds remain `noindex`. `VITE_SITE_URL` is the canonical corporate origin. The `VITE_*_SITE_URL` division origins are used for each division's canonical URLs and host-specific sitemap. `llms.txt` lists the corporate and division sites. `VITE_APP_URL` is not used to override canonical URLs.

After deploying SEO changes:

1. Verify `/robots.txt` and `/sitemap.xml` on the corporate host and all five division hosts return successfully and list only URLs from their own host.
2. Add `https://mahdev-official.vercel.app/` as a URL-prefix property in Google Search Console. The Google HTML-token meta tag and HTML-file verification methods are included in the production build (`/` and `/google557fd5590c618eb4.html`). After deploying, use either HTML verification method in Search Console. The supplied DNS TXT value is `google-site-verification=oDHseI7gVMRQyDiFx63DQwSAKbXVJdR2y6cqBL_Dn0Q`; DNS verification requires control of the domain's DNS zone and cannot be configured on the shared `vercel.app` domain. For Bing, set `VITE_BING_SITE_VERIFICATION` in Vercel Production and redeploy before verification.
3. Submit each host's own `/sitemap.xml` in both webmaster consoles, then inspect the homepage and key service/career URLs and request indexing where offered. Indexing and ranking are decided by each search engine and cannot be guaranteed.
4. In **Admin > Settings > Company**, enter the full public profile URLs for Facebook, Instagram, LinkedIn, YouTube, TikTok, and WhatsApp. Saved links appear as icons in the global footer and About page; blank or invalid URLs are omitted.
5. Set `VITE_GTM_CONTAINER_ID` to the production GTM container ID; it loads for public corporate and configured division hosts when marketing events are sent. Configure GA4 tags and event triggers in that GTM container. Optional direct GA4 and Meta Pixel integrations use `VITE_GA_MEASUREMENT_ID` and `VITE_META_PIXEL_ID`. Page views, leads, quotes, bookings, checkout starts, purchases, cart additions, and WhatsApp outbound clicks are tracked without sending contact details. Marketing tags are not loaded on admin routes and respect DNT and GPC. The Admin > Analytics traffic view groups unique visitors into sources such as Google, Facebook, WhatsApp, and Direct. WhatsApp click counts measure link clicks, not messages sent.
6. Use complete, accurate service descriptions, prices/quote guidance, features, images, and division assignments. Published services receive individual `/services/{slug}` pages and are included in the sitemap. Publish active divisions and useful CMS case studies; drafts and inactive items are excluded. Do not publish placeholder pages or keyword-only articles.
7. For paid campaigns, add Google Ads and Meta campaign links with `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content` values. First-party page-view records retain these campaign labels, and **Admin > Analytics** reports tagged campaigns and visits referred by search engines. Search Console query, impression, and click metrics require reviewing the verified Search Console account.

---

## 6. Custom Domain Configuration

Until the division custom domains are configured, this shared Vercel project can assign temporary Vercel aliases to the production deployment. Each alias maps the division to `/` using its Production `VITE_*_SITE_URL` variable. These aliases are not separate projects or deployments; they share the app, backend, database, and admin.

The project currently has Vercel SSO deployment protection for non-custom domains. Temporary `*.vercel.app` aliases may therefore prompt visitors to sign in to Vercel. Do not disable SSO protection project-wide without explicit approval; use the owned `mahdev.lk` custom subdomains for public access if that protection must remain enabled.

After purchase, add `mahdev.lk`, `www.mahdev.lk`, `sws.mahdev.lk`, `u1.mahdev.lk`, `it.mahdev.lk`, `travels.mahdev.lk`, and `mart.mahdev.lk` to this **same project** under **Settings → Domains**. Follow the DNS targets Vercel displays for each hostname; do not assume a copied A/CNAME value is valid for this project. Configure `VITE_SITE_URL` and the division origin variables above in the Production environment, then redeploy. The app maps each division host to its division homepage while using this project's shared `/api` functions, database, storage, and admin portal. See [DOMAIN_CONFIGURATION.md](./DOMAIN_CONFIGURATION.md) for the full rollout and verification checklist.

---

## 7. Pre-Flight Deployment Checklist

Run the retained typecheck and production build before deployment:

```bash
# Execute local pre-flight checks before pushing PR:
npm run preflight
```

- Run `npm run lint` to type-check the source.
- Run `npm run build` to generate the production bundle.
- Automated test files and test runner commands have been removed from this repository; historical test reports are not current verification.

---

## 7. Rollback Reference

For detailed instant rollback instructions via the Vercel Dashboard or CLI, refer to [PIPELINE_AND_ROLLBACK.md](./PIPELINE_AND_ROLLBACK.md).

## Changing the corporate or division host

Add the hostname to this Vercel project, set the relevant Production-only origin variable (`VITE_SITE_URL` for the company site or one of `VITE_SWS_SITE_URL`, `VITE_U1_SITE_URL`, `VITE_IT_SITE_URL`, `VITE_TRAVELS_SITE_URL`, `VITE_MART_SITE_URL`), and redeploy. Keep each value to an origin with no path. Add the host to Firebase Authentication's authorized domains and any App Check/OAuth allowlists, then verify canonical URLs, sitemap entries, API calls, and direct page refreshes. Do not change the existing database or server secrets for a host-only move.
