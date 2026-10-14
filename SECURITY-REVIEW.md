# Security and data-transfer review

**Reviewed:** 2026-10-14  
**Scope:** Public database access, exposed settings, media reads, client caching, and recurring database requests.

## Security findings

No exploitable data leaks were identified in the reviewed authorization paths.

- Public reads of private collections such as users, analytics events, and career applications require authorization.
- Anonymous callers cannot enumerate the top-level `media_blobs` collection. Media chunks remain readable when a caller knows a blob ID; IDs referenced by public site content are intentional public media.
- Public `settings` responses now remove administrator identity, test, backup, and stock-alert fields while preserving public presentation settings.

## Data-transfer finding

| # | Severity | File | Lines | Finding | Confidence |
|---|----------|------|-------|---------|------------|
| 1 | ⚪ LOW | [src/services/firestore/media.ts](./src/services/firestore/media.ts) | 257-289 | The public `media_assets` collection has no server-side result limit. It is now fetched only when Gallery/U1 needs it and cached on-device, so returning visits do not repeat the transfer; the initial fetch for those views still includes the full collection. | 10/10 |

The repeated cold-page transfer was removed by lazy loading and persistent client caching. Further reducing the first Gallery/U1 transfer would require pagination or a result cap; a cap may hide older media and needs an agreed retention/display policy.

## Transfer observations and mitigations

- The live `hero_landing.mp4` response was about 6.25 MB and had `Cache-Control: public, max-age=0, must-revalidate`, despite the repository's asset cache rules. The cache rule is now also attached to the Vercel filesystem routes; production behavior must be rechecked after deployment.
- A public SWS hero video stored as chunked database media is about 24.5 MB. Resolved media is now persisted in IndexedDB with a 64 MB cache limit, so repeat visits on that device avoid downloading the chunks again. A first visit still transfers the media.
- Public content and media metadata are cached on-device without an automatic expiry. Authentication, admin reads, submissions, and analytics writes remain network-backed because they are user-specific or intentional writes.
- API logs do not provide enough byte-level data to quantify Fast Origin Transfer totals from the reviewed sample.

## Verification

- `npm test` passed, including the database authorization and settings-redaction tests.
- `npm run lint` passed.
- `npm run build` passed.
