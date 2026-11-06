# Mahdev domains and division websites

## Current architecture

Keep **one Vercel project, one production deployment, one frontend codebase, and one shared backend/database**. The corporate portfolio stays at the project's main URL (currently `mahdev-official.vercel.app`). The divisions already have separate page experiences at `/sws`, `/u1`, `/it`, `/travels`, and `/mart`.

The shared Vercel project can assign temporary aliases under `*.vercel.app` to its production deployment. Each alias maps to a division at `/` using the relevant production environment variable. These are aliases of one project, not separate Vercel projects. The current project has SSO protection for non-custom domains, so a temporary alias may require visitors to sign in to Vercel. Keep that protection enabled unless the project owner explicitly approves changing it.

When the custom domain is ready, add the corporate and division hostnames to the **same Vercel project**. A configured division host opens that division at `/`; the company site and the division continue to use the same deployment, `/api` functions, Firebase/Turso configuration, and admin application. This is a shared-code deployment with host-based site experiences, not five independently deployed applications.

| Site | Production address | Current Vercel address |
|---|---|---|
| Mahdev corporate portfolio | `https://mahdev.lk` | `https://mahdev-official.vercel.app/` |
| SWS Event Management | `https://sws.mahdev.lk` | `https://sws-events.vercel.app` |
| U1 Studio | `https://u1.mahdev.lk` | `https://u1-studio.vercel.app` |
| Mahdev IT | `https://it.mahdev.lk` | `https://mahdev-it.vercel.app` |
| Mahdev Travels | `https://travels.mahdev.lk` | `https://mahdev-travels.vercel.app` |
| Mahdev Mart | `https://mart.mahdev.lk` | `https://mahdev-mart.vercel.app` |

## Temporary Vercel hostnames before configuring custom domains

The current project gets the default address `mahdev-official.vercel.app`. It can also assign available aliases such as `sws-events.vercel.app`, `u1-studio.vercel.app`, `mahdev-it.vercel.app`, `mahdev-mart.vercel.app`, and `mahdev-travels.vercel.app` to the same production deployment. Availability is determined by Vercel when the alias is assigned. Set each matching `VITE_*_SITE_URL` Production variable and redeploy so the application opens the correct division at `/` and redirects corporate `/sws` and `/u1` links to their division origin.

All aliases share the existing project, `/api` functions, database, admin portal, Firebase project, and deployed code. The current project has Vercel SSO protection on non-custom hosts; that can make `.vercel.app` aliases sign-in-gated. Do not disable project-wide SSO without the owner's approval. Once custom domains are configured, keep them on this same project and update the corresponding production host variables.

## What is separated and what is shared

- **Separate presentation:** each division host opens its own division, uses its own navigation and has its own theme. SWS uses maroon, gold, and warm off-white; U1 uses black and off-white. IT, Travels, and Mart have distinct blue, green, and warm retail accents.
- **Shared data:** the divisions can use the same Firestore/Turso collections, customer accounts, bookings, orders, and admin records. Keep using the existing database; do not duplicate or migrate it.
- **Independent browser origins:** local storage and browser sessions are origin-scoped. Users may need to sign in separately on different subdomains; the admin login still uses the same server and data. Do not change cookie domain scope without reviewing the authentication and CSRF implications.
- **SEO:** division canonical URLs switch to the configured division host. The generated main sitemap uses each configured division URL for its division landing page. Preview deployments should not be given production division URLs.
- **Deployment choice:** custom domains on this existing Vercel project share one release. Separate `*.vercel.app` project hosts have separate releases and each must receive the shared backend configuration.

## When `mahdev.lk` is purchased

1. In Vercel, open the existing project → **Settings → Domains** and add `mahdev.lk`, `www.mahdev.lk`, `sws.mahdev.lk`, `u1.mahdev.lk`, `it.mahdev.lk`, `travels.mahdev.lk`, and `mart.mahdev.lk`. Assign all of them to the same production project. Use Vercel's displayed DNS instructions as the source of truth; required records can vary by account and domain.
2. At the DNS provider, create the exact apex, `www`, and division-subdomain records Vercel requests. A wildcard `*.mahdev.lk` record is optional; explicit records are easier to audit. Avoid conflicting A/AAAA/CNAME records.
3. Configure the following **public** Vite variables in Vercel for **Production only**, then redeploy:

   ```text
   VITE_SITE_URL=https://mahdev.lk
   VITE_SWS_SITE_URL=https://sws.mahdev.lk
   VITE_U1_SITE_URL=https://u1.mahdev.lk
   VITE_IT_SITE_URL=https://it.mahdev.lk
   VITE_TRAVELS_SITE_URL=https://travels.mahdev.lk
   VITE_MART_SITE_URL=https://mart.mahdev.lk
   ```

   Each value must be an origin only: `https://host`, with no path, query, or trailing route. These values are public build-time configuration; never put secrets in `VITE_*` variables.
4. Keep the existing server-only environment variables unchanged. Every host must continue to use the same Turso URL/token/database name, Firebase project, storage bucket, and admin credentials in the existing Vercel project.
5. Add every host that uses Firebase sign-in to Firebase Authentication's **Authorized domains**. For email action links, configure the corporate host's `/auth/action` URL (or the specific host needed by the flow).
6. Verify HTTPS certificates are active in Vercel before sharing the domains. Check direct navigation and refresh on each host, the expected theme, division-only navigation, booking/order flows, `/api/health`, `/admin-yuvan1709`, canonical tags, and the sitemap.
7. Keep `www.mahdev.lk` as a Vercel domain redirect to `mahdev.lk` if the corporate apex is the preferred canonical hostname. Do not redirect division hosts to the corporate host.

### DNS checks after setup

Use the DNS targets shown in the Vercel dashboard (do not copy a target from an old deployment guide):

```bash
dig mahdev.lk A +short
dig sws.mahdev.lk CNAME +short
curl -I https://mahdev.lk/
curl -I https://sws.mahdev.lk/
curl -I https://u1.mahdev.lk/
curl -I https://mart.mahdev.lk/
```

The hostname requests should resolve to the same Vercel project and return the correct site at `/`. DNS and certificate changes can take time to propagate.

## Account email links (verification and password reset)

Account emails use the website's `/auth/action` page (`src/views/auth/AuthActionView.tsx`). In Firebase Console → **Authentication → Templates**, set the email verification action URL to the deployed corporate host, for example `https://mahdev.lk/auth/action`; then add all active hosts under **Authentication → Settings → Authorized domains**. Until the action URL is customized, Firebase's default handler continues to work.
