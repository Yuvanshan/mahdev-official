# Mahdev Pvt Ltd — Production CI/CD Pipeline & Rollback Operations Manual (Phase 38)

This operations manual governs deployment from **GitHub** to **Vercel** production hosting for **Mahdev Pvt Ltd**, including build validation and rollback procedures.

---

## 1. Branching Model & Deployment Workflow

```text
┌─────────────────────────┐
│     feature/* branch    │  ➔ Local development & unit validation
└────────────┬────────────┘
             │
             ▼ Push
┌─────────────────────────┐
│   development branch    │  ➔ Staging integration
└────────────┬────────────┘
             │
             ▼ Webhook Trigger
┌─────────────────────────┐
│    Vercel Preview       │  ➔ https://mahdev-website-git-development-*.vercel.app
│      Deployment         │  ➔ Isolated test sandbox & QA evaluation
└────────────┬────────────┘
             │
             ▼ Type check and production build
┌─────────────────────────┐
│  Pull Request to `main`  │  ➔ Vercel Preview deployment
└────────────┬────────────┘
             │
             ├── 1. Type check (`npm run lint`)
             └── 2. Production bundle build (`npm run build`)
             │
             ▼ PR merged to `main`
┌─────────────────────────┐
│       main branch       │  ➔ Authoritative production codebase
└────────────┬────────────┘
             │
             ▼ Automated Production Webhook
┌─────────────────────────┐
│    Vercel Production    │  ➔ Live Enterprise Platform: https://mahdev.lk
│       Deployment        │  ➔ Automatic global CDN edge propagation (0ms downtime)
└─────────────────────────┘
```

---

## 2. Pre-Production Build Checks

Run the following checks before promoting a build to production:

| Check Category | Command | Pass Criteria | Strict Policy |
| :--- | :--- | :--- | :--- |
| **Type Safety** | `npm run lint` | `tsc --noEmit` exits with status `0`. | Required before deployment |
| **Production Build** | `npm run build` | Vite client and backend bundles compile cleanly. | Required before deployment |

Automated test files and test-runner commands have been removed from this repository. Do not treat historical test reports elsewhere in this manual as current verification.

---

## 3. Strict Production Deployment Rule

> ⚠️ **CRITICAL OPERATIONAL DIRECTIVE**:
> - **DO NOT DEPLOY BROKEN BUILDS.**
> - **DO NOT BYPASS FAILED CHECKS.**
> - Do not promote a build if type checking or production bundling fails.
> - Review changes and verify critical application flows before production deployment.

---

## 4. Rollback & Disaster Recovery Procedures

In the event of an unexpected runtime defect, payment gateway anomaly, or security regression post-launch, execute the appropriate rollback procedure immediately:

### Option A: Instant Vercel Rollback (Instantaneous — < 10 seconds, Zero Downtime)

1. Open the **[Vercel Dashboard](https://vercel.com)** ➔ Select **mahdev-website**.
2. Navigate to the **Deployments** tab.
3. Locate the last known **stable production deployment** (marked with a green checkmark).
4. Click the three dots (`...`) next to the deployment and select **Instant Rollback** (or **Promote to Production**).
5. Vercel will instantly point DNS routing and CDN edge nodes for `mahdev.lk` to the previous build artifact.

```bash
# Alternative via Vercel CLI:
vercel rollback [DEPLOYMENT_ID]
```

### Option B: Git Revert Rollback (Codebase Synchronization)

When reverting code changes in the authoritative repository:

```bash
# 1. Checkout main branch and fetch latest
git checkout main
git pull origin main

# 2. Revert the problematic merge commit or commit hash
git revert -m 1 HEAD   # For merge commits
# or: git revert <commit_hash>

# 3. Verify locally that type checking and build pass
npm run preflight

# 4. Push revert commit to main
git push origin main
```
*A push to the configured production branch triggers the Vercel deployment integration.*

### Option C: Firestore Security Rules Rollback

If a database rule regression occurs:

```bash
# Deploy previously committed firestore.rules
firebase deploy --only firestore:rules --project "$FIREBASE_PROJECT_ID"
```

### Option D: Database State Rollback

If data corruption occurred:
1. Refer to `DATA_BACKUP_AND_RECOVERY.md`.
2. Locate the daily automated backup in Google Cloud Storage (`gs://mahdev-backups-asia-southeast1/`).
3. Restore the verified snapshot to the Firestore instance.

---

## 5. Production Integration & Verification Matrix

| Component | Target Provider | Configuration Status | Verification Notes |
| :--- | :--- | :---: | :--- |
| **GitHub** | GitHub Repositories | **CONNECTED** | Production source branch is configured in Vercel. |
| **Vercel** | Vercel Serverless / Edge CDN | **VERIFIED** | Connected to GitHub. Output directory set to `dist/`. SPA rewrite and caching headers configured in `vercel.json`. |
| **Firebase** | Google Cloud Firebase Platform | **CONFIGURED VIA ENVIRONMENT** | Client configuration comes from `VITE_FIREBASE_*`; server integrations use Firebase environment variables. |
| **Application database** | Turso (libSQL) | **CONFIGURED VIA SERVER ENVIRONMENT** | Connection uses `TURSO_DATABASE_URL` and secret `TURSO_AUTH_TOKEN`; app provisions one SQL table per collection. Firebase remains for Authentication and Storage. |
| **Authentication** | Firebase Auth & HMAC Server Kernel | **VERIFIED** | Multi-factor customer auth, admin HMAC token generation with salt, and role separation. |
| **Storage** | Firebase Storage Buckets | **CONFIGURED VIA ENVIRONMENT** | Bucket selected by `FIREBASE_STORAGE_BUCKET`; partitioned security rules in `storage.rules`. |
| **Domain & TLS** | LK Domain / Vercel DNS (`mahdev.lk`) | **VERIFIED** | DNS mapped (`A` -> `76.76.21.21`, `CNAME` -> `cname.vercel-dns.com`). Automated TLS 1.3 certificate. |
| **Environment Variables** | Vercel Environment Variables | **VERIFIED** | Documented in `.env.example` and `ENV_VARIABLES.md`. Runtime verification via `serverEnv.ts`. |

---

## 6. Production Configuration Change Management

Any future modification to production environment variables, DNS records, Firestore indexes, or third-party webhooks MUST adhere to the following protocol:
1. Document the requested modification in `ENV_VARIABLES.md` or `DOMAIN_CONFIGURATION.md`.
2. Test the modification first in a Vercel Preview environment.
3. Obtain change authorization from the Operations Lead or Super Admin.
4. Record the configuration change in the deployment audit log.
