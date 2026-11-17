# Mahdev domains and division websites

Mahdev is **one website** on one Vercel project, one deployment, one codebase and one backend/database.
Every division is a path on the same origin, with no separate division domains or subdomains:

| Site | Address |
|---|---|
| Mahdev corporate site | `https://mahdev-official.vercel.app/` |
| SWS Event Management | `https://mahdev-official.vercel.app/sws` |
| U1 Studio | `https://mahdev-official.vercel.app/u1` |
| Mahdev IT | `https://mahdev-official.vercel.app/it` |
| Mahdev Travels | `https://mahdev-official.vercel.app/travels` |
| Mahdev Mart | `https://mahdev-official.vercel.app/mart` |

Because everything shares one origin, the cart, customer sign-in and admin session are shared by all divisions.

## Custom domain

Add the domain (for example `mahdev.lk`) to the same Vercel project, set `VITE_SITE_URL` to it for Production
(origin only, such as `https://mahdev.lk`), and redeploy. Add the host to Firebase Authentication's
**Authorized domains** and to the reCAPTCHA allowed domains.
