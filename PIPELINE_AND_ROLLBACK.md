# Mahdev Pvt Ltd — Production CI/CD Pipeline & Rollback Operations Manual (Phase 38)

This operations manual governs the automated deployment pipeline from **GitHub** to **Vercel** production hosting for **Mahdev Pvt Ltd** (`https://mahdev.lk`), establishing strict quality gates, automated testing, security validation, and instant rollback procedures.

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
             ▼ Comprehensive QA & Security Review
┌─────────────────────────┐
│  Pull Request to `main` │  ➔ Triggers GitHub Actions CI Pipeline
└────────────┬────────────┘
             │
             ├── 1. Lint (`npm run lint`)
             ├── 2. Type check (`npm run typecheck`)
             ├── 3. Automated Security & Pricing Tests (`npm test`)
             ├── 4. Storage & MIME Validation (`npm run test:storage`)
             ├── 5. Disaster Recovery Integrity Drill (`npm run test:recovery`)
             └── 6. Production Bundle Build (`npm run build`)
             │
             ▼ PR Merged to `main` (Only if ALL 6 checks PASS)
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

## 2. Pre-Production Automated Checks Matrix

Before any build is promoted to production, the continuous integration pipeline executes the following checks sequentially:

| Check Category | Command | Pass Criteria | Strict Policy |
| :--- | :--- | :--- | :--- |
| **Linting** | `npm run lint` | Zero ESLint / formatting violations. | **Blocker** — PR blocked on failure |
| **Type Safety** | `npm run typecheck` | `tsc --noEmit` exits with status `0`. Zero type inconsistencies. | **Blocker** — PR blocked on failure |
| **Automated Tests** | `npm test` | All 11 automated test suites pass (pricing, anti-bot, fiscal invoices). | **Blocker** — PR blocked on failure |
| **Security Rules** | `npm run test:security` | 20+ Firestore RBAC scenarios pass 100% (anti-escalation & IDOR protection). | **Blocker** — PR blocked on failure |
| **Storage Rules** | `npm run test:storage` | MIME whitelisting, file size caps (8MB/15MB), and path hierarchy verified. | **Blocker** — PR blocked on failure |
| **Disaster Recovery** | `npm run test:recovery` | SHA-256 snapshot serialization & sandbox restore verified. | **Blocker** — PR blocked on failure |
| **Production Build** | `npm run build` | Vite client bundle + Node/Express backend `dist/server.cjs` compiles cleanly. | **Blocker** — PR blocked on failure |
| **Environment Check**| `serverEnv.ts` | All required runtime keys confirmed against schema. | **Blocker** — PR blocked on failure |

---

## 3. Strict Production Deployment Rule

> ⚠️ **CRITICAL OPERATIONAL DIRECTIVE**:
> - **DO NOT DEPLOY BROKEN BUILDS.**
> - **DO NOT BYPASS FAILED CHECKS.**
> - Merging to `main` with failing CI checks or skipping quality gates is strictly prohibited.
> - Pull Requests must achieve 100% green status across all automated stages and require authorized peer review before production deployment.

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

# 3. Verify locally that preflight passes
npm run preflight

# 4. Push revert commit to main
git push origin main
```
*Pushing the revert to `main` automatically triggers the GitHub Actions CI pipeline and deploys the clean state to Vercel.*

### Option C: Firestore Security Rules Rollback

If a database rule regression occurs:

```bash
# Deploy previously committed firestore.rules
firebase deploy --only firestore:rules --project for-her-33ea9
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
| **GitHub** | GitHub Repositories | **VERIFIED** | Branch protection enabled on `main`. Automated GitHub Actions workflow (`.github/workflows/production-pipeline.yml`). |
| **Vercel** | Vercel Serverless / Edge CDN | **VERIFIED** | Connected to GitHub. Output directory set to `dist/`. SPA rewrite and caching headers configured in `vercel.json`. |
| **Firebase** | Google Cloud Firebase Platform | **VERIFIED** | Initialized via SDK (`for-her-33ea9`). Config in `firebase-applet-config.json`. |
| **Application database** | Turso (libSQL) | **CONFIGURED VIA SERVER ENVIRONMENT** | Connection uses `TURSO_DATABASE_URL` and secret `TURSO_AUTH_TOKEN`; app provisions one SQL table per collection. Firebase remains for Authentication and Storage. |
| **Authentication** | Firebase Auth & HMAC Server Kernel | **VERIFIED** | Multi-factor customer auth, admin HMAC token generation with salt, and role separation. |
| **Storage** | Firebase Storage Buckets | **VERIFIED** | Bucket `for-her-33ea9.firebasestorage.app`. Partitioned security rules in `storage.rules`. |
| **Domain & TLS** | LK Domain / Vercel DNS (`mahdev.lk`) | **VERIFIED** | DNS mapped (`A` -> `76.76.21.21`, `CNAME` -> `cname.vercel-dns.com`). Automated TLS 1.3 certificate. |
| **Environment Variables** | Vercel Environment Variables | **VERIFIED** | Documented in `.env.example` and `ENV_VARIABLES.md`. Runtime verification via `serverEnv.ts`. |

---

## 6. Production Configuration Change Management

Any future modification to production environment variables, DNS records, Firestore indexes, or third-party webhooks MUST adhere to the following protocol:
1. Document the requested modification in `ENV_VARIABLES.md` or `DOMAIN_CONFIGURATION.md`.
2. Test the modification first in a Vercel Preview environment.
3. Obtain change authorization from the Operations Lead or Super Admin.
4. Record the configuration change in the deployment audit log.
