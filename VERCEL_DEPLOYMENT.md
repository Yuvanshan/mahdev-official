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

The project includes a root `vercel.json` configured specifically for modern React + Vite single-page applications:

- **Framework**: `vite`
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x` or `22.x`

### Security & Caching Headers
- **Defense in Depth**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Immutable Static Assets**: `Cache-Control: public, max-age=31536000, immutable` for all files in `/assets/`.
- **SPA Fallback**: Clean URL rewrite routing all unmatched routes to `/index.html`.

### API coverage limitation

Vercel deploys files under `api/` as serverless functions; it does not automatically run the Express routes in `server.ts`. The current functions cover Turso data, Firebase admin-token verification, and media upload only. The frontend still calls other `/api/*` paths for payments, order validation, email dispatch, settings, and Google Reviews. Those endpoints need Vercel handlers (or a separately hosted Express service) before those features can be considered production-ready on Vercel. The SPA fallback is not an API implementation.

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
| `VITE_APP_URL` | Production: `https://mahdev.lk`<br>Preview: `https://$VERCEL_URL`<br>Development: `http://localhost:3000` | Canonical base URL |
| `VITE_FIREBASE_API_KEY` | Production, Preview, Development | Public Firebase Web SDK API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production, Preview, Development | `for-her-33ea9.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Production, Preview, Development | `for-her-33ea9` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | `for-her-33ea9.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development | `1062826041810` |
| `VITE_FIREBASE_APP_ID` | Production, Preview, Development | `1:1062826041810:web:2905a8e9f7bc3243dfa80b` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Production, Preview, Development | `G-MWNCCXGY4F` |
| `TURSO_DATABASE_URL` | Production, Preview, Development | Server-side Turso connection URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Production, Preview, Development | Server-side Turso auth token; store as a secret |
| `FIREBASE_PROJECT_ID` | Production, Preview, Development | Firebase project ID used by the server to verify Firebase ID tokens |
| `TURSO_ADMIN_EMAILS` | Production, Preview, Development | Server-only bootstrap allowlist for verified Firebase administrators; optional `:role` suffix |
| `VITE_TURSO_DATABASE_NAME` | Production, Preview, Development | Optional public database label for diagnostics |
| `VITE_FIREBASE_RECAPTCHA_SITE_KEY` | Production | reCAPTCHA v3 / Enterprise Site Key for App Check |
| `PAYMENT_GATEWAY_ENV` | Production: `production`<br>Preview/Dev: `sandbox` | Payment verification engine mode |
| `STRIPE_SECRET_KEY` | Production: `sk_live_...`<br>Preview/Dev: `sk_test_...` | Stripe Server Secret API Key |
| `PAYMENT_WEBHOOK_SECRET` | Production, Preview | HMAC-SHA256 signature verification key |
| `ORDER_SIGNATURE_SECRET` | Production, Preview | Authoritative order signing secret |
| `INVOICE_SIGNING_SALT` | Production, Preview | Tamper-proof tax invoice signature salt |
| `GEMINI_API_KEY` | Production, Preview, Development | Gemini AI intelligence secret |

> ⚠️ **Note**: After adding or modifying environment variables in Vercel, you must trigger a redeployment for the changes to take effect.

### Admin sign-in and database permissions

The admin portal authenticates through Firebase Email/Password Authentication. The browser sends its Firebase ID token to the server; the server verifies the signature and project audience with Firebase Admin SDK and requires a verified email. Access is granted to bootstrap addresses in `TURSO_ADMIN_EMAILS` or to active users in the Turso `admins` registry. No Firebase service-account private key is required for token verification.

1. In Firebase Authentication, enable Email/Password and create the first admin account. Verify its email.
2. In Vercel, set `FIREBASE_PROJECT_ID` and add that initial account to `TURSO_ADMIN_EMAILS`, for example `owner@example.com:super_admin`. An address without a role defaults to `super_admin`.
3. Keep these variables server-only (do not prefix them with `VITE_`), then redeploy and sign in with the verified account.
4. Create additional Firebase accounts and verify their emails, then provision their roles in the admin portal. Only a super administrator can read or change the Turso admin registry.
5. Keep an environment allowlist entry for at least one bootstrap super administrator. Admin content writes and destructive database actions reject unverified or unauthorized requests; public reads remain available.

The previous demo PIN and permissive password fallback are disabled. Do not deploy until the allowlist and Firebase admin accounts are configured.

---

## 5. Custom Domain Configuration (`mahdev.lk`)

1. In the Vercel Dashboard, go to **Settings > Domains**.
2. Enter `mahdev.lk` and `www.mahdev.lk`.
3. In your DNS provider (Cloudflare, GoDaddy, Namecheap, or LK Domain Registry), add the following DNS records:
   - **Type A**: `@` pointing to `76.76.21.21`
   - **Type CNAME**: `www` pointing to `cname.vercel-dns.com`
4. Vercel will automatically provision a free SSL/TLS certificate via Let's Encrypt.

---

## 6. Pre-Flight Deployment Checklist & Quality Gates

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
