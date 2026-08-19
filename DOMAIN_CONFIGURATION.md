# Mahdev Pvt Ltd — Custom Domain & DNS Architecture (Phase 32)

This document outlines the custom domain configuration for **`mahdev.lk`**, detailing DNS records, canonical routing, HTTPS enforcement, and search engine optimization.

---

## 1. Domain Overview

- **Primary Canonical Domain**: `https://mahdev.lk`
- **Secondary Domain**: `https://www.mahdev.lk` (301 Permanent Redirect to `https://mahdev.lk`)
- **DNS Registrar**: LK Domain Registry (.lk NIC)
- **Edge Routing & SSL/TLS**: Vercel Edge Network / Google Cloud Run HTTPS Proxy
- **Strict HTTPS**: Enabled via automatic TLS 1.3 certificate provisioning with HSTS

---

## 2. Verified Primary Routes (Direct Browser Entry)

All routes below are configured with SPA fallback and resolve directly when typed into a browser address bar:

| Route Path | Division / Page | Canonical URL | Direct Entry Status |
| :--- | :--- | :--- | :--- |
| `/` | Mahdev Corporate Ecosystem (Home) | `https://mahdev.lk` | **Verified** |
| `/sws` | Mahdev SWS (Event Management & Weddings) | `https://mahdev.lk/sws` | **Verified** |
| `/u1` | Mahdev U1 (Photography & 4K Cinema) | `https://mahdev.lk/u1` | **Verified** |
| `/it` | Mahdev IT & Solutions (Software & AI) | `https://mahdev.lk/it` | **Verified** |
| `/travels` | Mahdev Travels (Sri Lanka Tours & Fleets) | `https://mahdev.lk/travels` | **Verified** |
| `/mart` | Mahdev Online Mart (Global Storefront) | `https://mahdev.lk/mart` | **Verified** |
| `/catalog` | Unified Multi-Division Catalog | `https://mahdev.lk/catalog` | **Verified** |
| `/book` | Centralized Booking Engine | `https://mahdev.lk/book` | **Verified** |
| `/about` | Corporate Story & Governance | `https://mahdev.lk/about` | **Verified** |
| `/portfolio` | Master Media & Milestone Gallery | `https://mahdev.lk/portfolio` | **Verified** |
| `/contact` | Central Dispatch & Offices | `https://mahdev.lk/contact` | **Verified** |
| `/account` | Customer Portal (Protected) | `https://mahdev.lk/account` | **Verified** |
| `/admin` | Administrative Kernel (Protected) | `https://mahdev.lk/admin` | **Verified** |

---

## 3. DNS Configuration Matrix

Add these DNS records at your domain registrar or DNS management provider (Cloudflare, LK Domain Registry, Route 53):

| Record Type | Host / Name | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (apex) | `76.76.21.21` | Auto / 300 | Routes apex `mahdev.lk` to Vercel Edge |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300 | Routes `www.mahdev.lk` to Vercel |
| **TXT** | `@` | `_vercel-dns-validation=...` | Auto | Domain ownership verification (if prompted) |

---

## 4. Canonical Redirects & Anti-Duplicate Indexing

1. **`www` to Apex 301 Redirect**:
   - `https://www.mahdev.lk/*` permanently redirects (HTTP 301) to `https://mahdev.lk/*`.
2. **HTTP to HTTPS**:
   - All unencrypted `http://` requests automatically upgrade to `https://`.
3. **Environment-Aware Search Engine Indexing (`robots.txt` & `SEOHead`)**:
   - **Production (`mahdev.lk`)**: `<meta name="robots" content="index, follow, max-image-preview:large">`
   - **Staging / Preview (`*.run.app`, `*.vercel.app`)**: `<meta name="robots" content="noindex, nofollow">` automatically injected by `src/components/layout/SEOHead.tsx`. This ensures search engines only index the official production domain.
4. **Canonical Meta Tags**:
   - Every view renders a `<link rel="canonical" href="https://mahdev.lk/..." />` tag linking to the authoritative URL.

---

## 5. Verification Commands

```bash
# 1. Test Apex DNS Resolution
dig mahdev.lk A +short

# 2. Test WWW CNAME Resolution
dig www.mahdev.lk CNAME +short

# 3. Test HTTP to HTTPS and WWW Canonical 301 Redirect
curl -I https://www.mahdev.lk/sws
# Expected Output: HTTP/2 301 -> Location: https://mahdev.lk/sws

# 4. Test Production Route Status
curl -I https://mahdev.lk/mart
# Expected Output: HTTP/2 200
```
