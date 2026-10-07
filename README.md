# Mahdev Pvt Ltd — Enterprise Multi-Division Digital Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?logo=turso&logoColor=black)](https://turso.tech/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

Mahdev Pvt Ltd is a premier Sri Lankan multinational conglomerate operating five integrated business divisions. This repository contains the unified, enterprise-grade web application, e-commerce catalog, booking engine, administrative portal, and secure backend microservices.

---

## 🏛️ Business Divisions

1. **SWS Media & Entertainment (Sound & Wave Systems)**
   - Concert audio engineering, DMX intelligent stage lighting, LED video walls, and luxury wedding event production.
2. **U1 Photography & Cinematography Studio**
   - High-end commercial cinematography, editorial studio sessions, aerial drone coverage, and color grading.
3. **Mahdev Travels & Destination Concierge**
   - Bespoke luxury Sri Lankan itineraries, VIP chauffeur logistics, tea estate retreats, and cultural expeditions.
4. **Mahdev IT & Cloud Solutions**
   - Enterprise software engineering, cloud migration, cybersecurity audits, and full-stack DevOps architectures.
5. **Mahdev Online Mart & Agro Exports**
   - Global export of Ceylon Single-Estate artisanal teas, Grade ALBA organic cinnamon, and authentic spices.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide Icons.
- **Backend & APIs**: Node.js, Express, Vite middleware mode, ESBuild CommonJS bundler.
- **Data & Storage**: Turso (libSQL) collection tables, Firebase Authentication, Firebase Storage, Firebase App Check (reCAPTCHA Enterprise).
- **Payments & IPG**: LankaPay National Payment Network, Stripe IPG, Bank Direct Transfer, HMAC-SHA256 verification.
- **Security & Integrity**: Sub-second velocity filtering, Honeypot traps, Rate limiting, Cryptographic invoice signing.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js `18.x` or `20.x` LTS
- npm `9.x` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/mahdev-pvt-ltd/mahdev-core-platform.git
cd mahdev-core-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the Turso database URL and auth token, plus the Firebase Authentication/Storage, Payments, and Admin settings. In the Turso dashboard, select a database and copy its connection URL; create an auth token for that database. Keep `TURSO_AUTH_TOKEN` server-side and do not expose it as a `VITE_` variable.

### 4. Start the Full-Stack Dev Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000` binding Express backend APIs and Vite frontend hot compilation.

---

## 📜 Development & Build Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Express + Vite unified development server on port 3000 |
| `npm run build` | Builds optimized frontend assets to `dist/` and compiles backend server to `dist/server.cjs` |
| `npm run start` | Boots production server from `dist/server.cjs` |
| `npm run migrate:turso` | Imports `firestore-dump.json` into Turso (or pass a backup path) |
| `npm run lint` | Runs TypeScript static analysis and linter (`tsc --noEmit`) |

---

## 🔐 Environment Variables Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server | Google AI Studio Gemini API key for intelligent assistance |
| `STRIPE_SECRET_KEY` | Server | Stripe Secret API key (`sk_live_...` or `sk_test_...`) |
| `PAYMENT_WEBHOOK_SECRET` | Server | HMAC-SHA256 secret for verifying payment gateway callbacks |
| `PAYMENT_GATEWAY_ENV` | Server | `sandbox` or `production` |
| `ADMIN_SECRET_SALT` | Server | Cryptographic salt for signing administrative session tokens |
| `ORDER_SIGNATURE_SECRET` | Server | Salt for generating immutable order hashes |
| `INVOICE_SIGNING_SALT` | Server | Salt for signing fiscal enterprise invoices |
| `NOTIFICATION_SECRET_SALT`| Server | Salt for securing multi-channel notifications |
| `TURSO_DATABASE_URL` | Server | Turso database connection URL (`libsql://...` or `https://...`) |
| `TURSO_AUTH_TOKEN` | Server | Private Turso database authentication token |
| `VITE_TURSO_DATABASE_NAME` | Client | Optional public display label for admin diagnostics |
| `VITE_FIREBASE_*` | Client | Public Firebase project keys (`apiKey`, `projectId`, `appId`, etc.) |
| `VITE_FIREBASE_RECAPTCHA_SITE_KEY` | Client | reCAPTCHA v3 / Enterprise site key for App Check |

---

## 🗄️ Turso Database Setup

1. Create/select a database in the Turso dashboard and copy its database URL from the database connection details. Generate an auth token for the database.
2. Put `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the server environment (root `.env` locally; deployment secrets in production). Never use a `VITE_` prefix for the auth token.
3. Start the server. It provisions one physical SQL table for every known application collection, plus the `turso_collections` and `turso_migrations` metadata tables. New collection tables are provisioned on first access.
4. To import the repository’s Firestore backup, run `npm run migrate:turso`. To use another JSON backup, run `npm run migrate:turso -- path/to/backup.json`. Imports are upserts and do not clear existing Turso rows.

Firebase remains in use for Authentication, Storage, and App Check; application records are stored in Turso. App Check initializes in `src/App.tsx` with environment-sensitive debug attestation in development and reCAPTCHA v3 in production.

---

## 🌿 Branching & Git Workflow

We adhere to standard Git Flow:

- `main`: Production-ready, deployed release branch.
- `development`: Active integration and staging branch.
- `feature/*`: New functional units (e.g. `feature/sws-booking-calculator`).
- `fix/*`: Bug fixes (e.g. `fix/cart-currency-conversion`).
- `hotfix/*`: Urgent production patches.

### Conventional Commit Standards
All commits must use semantic commit prefixes:
```bash
feat: add SWS service package tier selection
fix: resolve customer booking phone number validation
perf: optimize Firestore product catalog query indexing
security: implement HMAC SHA-256 webhook signature verification
docs: update API documentation for invoice generation
chore: update npm dependencies
```

---

## 🚀 Deployment (Vercel & Cloud Run)

The repository is configured for automated CI/CD deployment via **Vercel** and container deployment via **Google Cloud Run**:

- **Vercel Deployment**: See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for full configuration, preview branch deployments, and domain setup.
- **Environment & Secrets Matrix**: See [ENV_VARIABLES.md](ENV_VARIABLES.md) for detailed variable documentation.

---

## 🛡️ Security Architecture & Anti-Abuse

- **Honeypot Traps**: Invisible input traps embedded in Registration, Booking Wizard, and Contact forms.
- **Velocity Validation**: Rejects sub-second programmatic bot submissions.
- **Disposable Email Defense**: Blocks temporary burner email domains on checkout and account creation.
- **Server Rate Limiting**: IP-based sliding window rate limiting on all API routes (`/api/orders/*`, `/api/invoices/*`, `/api/payment/*`).
- **Server-Authoritative Pricing**: Cart items and discounts are recalculated against the master server catalog to prevent client tampering.

---

## 📄 License & Proprietary Notice

Copyright © 2026 Mahdev Pvt Ltd. All rights reserved.  
Unauthorized copying, reverse engineering, or redistribution of this software is strictly prohibited.
