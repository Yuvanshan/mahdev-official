# Mahdev Enterprise — Environment Configuration & Secrets Guide

This document outlines the environment configuration architecture for the **Mahdev Pvt Ltd** enterprise web application, defining variable scopes, security classifications, and per-environment configurations.

---

## 1. Architectural Principles

1. **Strict Client/Server Isolation**:
   - **Client-Side Variables (`VITE_*`)**: Embedded into the frontend bundle at build time. Only non-sensitive configurations (Firebase public keys, analytics identifiers, map display tokens) may use the `VITE_` prefix.
   - **Server-Side Secrets**: Processed strictly within `server.ts` or `server/*` via `process.env`. Never transmitted to the client browser or exposed via API error payloads.
2. **Zero Hard-Coded Credentials**:
   - The application functions seamlessly in **Development**, **Preview**, and **Production** environments without embedding hardcoded secrets in source files.
   - Development fallbacks provide sandbox simulations (mock payment verification, console email dispatch) to enable frictionless local development.
3. **Multi-Environment Support**:
   - **Development**: Local machine or AI Studio development container.
   - **Preview**: Pull Request branches and staging environments (Cloud Run preview instances, Vercel Preview).
   - **Production**: Live cluster serving `https://mahdev.lk`.

---

## 2. Environment Variables Matrix

| Variable Name | Scope | Security Level | Purpose | Example / Default |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | Standard | Node execution mode | `development` / `production` |
| `PORT` | Server | Standard | HTTP server port | `3000` |
| `APP_URL` | Server | Standard | Canonical base URL | `https://mahdev.lk` |
| `VITE_APP_URL` | Client | Public | Public origin URL for redirects | `https://mahdev.lk` |
| `GEMINI_API_KEY` | Server | **Confidential** | Google Gemini AI processing | Injected by AI Studio |
| `VITE_FIREBASE_API_KEY` | Client | Public | Firebase Web SDK API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | Public | Firebase Auth domain | `for-her-33ea9.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Client | Public | Firebase Project ID | `for-her-33ea9` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client | Public | Cloud Storage Bucket | `for-her-33ea9.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client | Public | FCM Sender ID | `1062826041810` |
| `VITE_FIREBASE_APP_ID` | Client | Public | Firebase Web App ID | `1:1062826041810:web:...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Client | Public | Firebase Analytics ID | `G-MWNCCXGY4F` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Client | Public | Named Firestore Database ID | `ai-studio-mahdevpvtltd-...` |
| `VITE_FIREBASE_RECAPTCHA_SITE_KEY` | Client | Public | App Check reCAPTCHA Site Key | `6Lf...` |
| `PAYMENT_GATEWAY_ENV` | Server | Standard | Payment mode (`sandbox` / `production`) | `sandbox` |
| `STRIPE_SECRET_KEY` | Server | **Confidential** | Stripe API Secret Key | `sk_test_...` / `sk_live_...` |
| `PAYMENT_WEBHOOK_SECRET` | Server | **Confidential** | HMAC-SHA256 webhook verification | Custom cryptographic string |
| `LANKAPAY_MERCHANT_ID` | Server | **Confidential** | LankaPay Merchant Identifier | Enterprise merchant code |
| `LANKAPAY_SECRET_KEY` | Server | **Confidential** | LankaPay Signing Secret | Private cryptographic key |
| `ADMIN_SECRET_SALT` | Server | **Confidential** | Admin token HMAC hashing salt | Secure kernel salt |
| `ORDER_SIGNATURE_SECRET` | Server | **Confidential** | Order integrity cryptographic key | Secure HMAC secret |
| `INVOICE_SIGNING_SALT` | Server | **Confidential** | Fiscal tax invoice HMAC salt | Tamper-proof hash key |
| `NOTIFICATION_SECRET_SALT` | Server | **Confidential** | Notification dispatch verification | Secure salt |
| `SMTP_HOST` | Server | **Confidential** | Outbound mail server hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | Server | Standard | Outbound mail server port | `587` |
| `SMTP_USER` | Server | **Confidential** | SMTP authentication username | `apikey` |
| `SMTP_PASS` | Server | **Confidential** | SMTP authentication password | API Key / Password |
| `SMTP_FROM_EMAIL` | Server | Standard | Outbound sender address | `notifications@mahdev.lk` |
| `WHATSAPP_API_TOKEN` | Server | **Confidential** | WhatsApp Cloud API Bearer Token | Meta System User Token |
| `WHATSAPP_PHONE_NUMBER_ID` | Server | Standard | WhatsApp Phone Number ID | Meta Phone ID |
| `VITE_GA_MEASUREMENT_ID` | Client | Public | Google Analytics 4 ID | `G-XXXXXXXXXX` |
| `VITE_GOOGLE_MAPS_API_KEY` | Client | Public | Google Maps API Display Key | `AIzaSy...` (HTTP restricted) |

---

## 3. Environment Scopes & Deployment Configuration

### A. Development (Local / AI Studio Container)
- Start command: `npm run dev`
- Uses `.env` or defaults to sandbox modes automatically.
- Payment gateway executes in simulated verification mode without contacting real banks.
- Emails and notifications log to server console for inspection.

### B. Preview / Staging (Cloud Run / Vercel Preview)
- Set `PAYMENT_GATEWAY_ENV=sandbox`
- Set `STRIPE_SECRET_KEY=sk_test_...`
- Set `VITE_APP_URL=https://staging.mahdev.lk` (or dynamic PR preview URL)
- Validates end-to-end integration flows without charging live cards or dispatching real SMS to end users.

### C. Production (`https://mahdev.lk`)
- Set `PAYMENT_GATEWAY_ENV=production`
- Set `STRIPE_SECRET_KEY=sk_live_...`
- Set `LANKAPAY_MERCHANT_ID` and `LANKAPAY_SECRET_KEY`
- Set `ADMIN_SECRET_SALT`, `ORDER_SIGNATURE_SECRET`, `INVOICE_SIGNING_SALT` to high-entropy 256-bit keys.
- Set `SMTP_*` and `WHATSAPP_*` credentials for live customer receipts.
- Enable App Check with production `VITE_FIREBASE_RECAPTCHA_SITE_KEY`.

---

## 4. Setting Environment Variables in Hosting Platforms

### Google Cloud Run
In the Google Cloud Console:
1. Navigate to **Cloud Run** > Select Service (`mahdev-core`).
2. Click **Edit & Deploy New Revision**.
3. Under **Variables & Secrets**, add runtime environment variables or bind Secret Manager entries (for `STRIPE_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET`, etc.).
4. Deploy the revision.

### Vercel Deployment
In the Vercel Dashboard:
1. Navigate to **Project Settings** > **Environment Variables**.
2. Add variables specifying scopes: **Development**, **Preview**, and **Production**.
3. Re-deploy project.
