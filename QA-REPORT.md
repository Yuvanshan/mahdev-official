# Mahdev Website QA & UX Report

**Initial assessment date:** 6 November 2026
**Remediation update:** 9 November 2026
**Environment:** Live Vercel deployment aliases; browser viewport observed at 433 × 454 px  
**Initial assessment:** Preview UX **7.3/10**; production-domain readiness **blocked pending domain decision**

## Executive summary

The corporate site and five division landing pages render on their Vercel aliases. The corporate navigation, SWS service search, and contact form's empty-submit validation behaved as expected during the public smoke checks.

The most important release gate is domain availability: `mahdev.lk` and all five documented division hostnames returned DNS `NXDOMAIN` from both the test resolver and Google Public DNS-over-HTTPS. The documentation describes the Vercel URLs as temporary and says custom domains are configured “when `mahdev.lk` is purchased,” so this is a launch blocker only if the custom domains are expected to be live now; it may be an acknowledged pre-launch state.

Three product/content issues need attention regardless of domain timing:

1. The Mahdev Travels page displays SWS event-management copy.
2. The Travels launch-alert form displays success even when saving the inquiry fails.
3. Corporate inquiry submission displays success before the contact record is saved.

The Mart storefront also labeled products “5 (0)”—a five-star rating with zero reviews—which is misleading.

## Remediation status

The code findings below have been addressed locally; changes still need to be deployed before they affect public Vercel pages.

| Finding | Status | Change / remaining action |
|---|---|---|
| Custom-domain DNS | **Pending external action** | All six hosts still returned `NXDOMAIN`. This cannot be fixed in application code; confirm the intended launch hosts, register/configure DNS, then recheck HTTPS. |
| Travels page uses SWS copy | **Fixed locally** | Added division-specific travel fallback content and rejected the identified SWS/event copy for Travels. |
| Travels launch alert reports false success | **Fixed locally** | Only confirm after a successful inquiry write; failed writes now show a retryable error and preserve form entries. |
| Corporate form reports false success | **Fixed locally** | Confirmation now follows a successful contact-record write; write failures show an accessible retry message and preserve form entries. Inline validation and native required semantics are retained. |
| Products show five stars with zero reviews | **Fixed locally** | Missing ratings now map to unrated, and product cards/details show “No reviews” until a real rating and review count exist. |
| Automatic WhatsApp popup obscures mobile content | **Fixed locally** | Removed the intrusive popup while restoring a subtle unread badge after 10 seconds. Opening chat clears the badge; the back-to-top button sits above it. |
| Mobile/webview scrolling can feel trapped | **Fixed locally; smoke-tested** | Removed mobile-wide `overflow-x: hidden` from every section (which could create nested scroll containers) and use non-scroll-container clipping at the page edge. A mobile-width detail-modal scroll test advanced the content normally. |
| Service/gallery/product images lack direct zoom affordance | **Improved locally; interaction-tested** | Added a shared hover-to-magnify desktop interaction and tap-to-toggle zoom on touch, with a focus marker at the zoom point, in service/gallery and product detail viewers. |
| Home preload warning on division routes | **Fixed locally** | Removed the static hero-poster preload from the shared app shell so division hosts no longer request an unused homepage image. The homepage poster is no longer explicitly preloaded either. |
| IT hero text contrast | **Fixed locally** | Added an IT-specific background overlay so the hero heading remains legible over the image. |
| Duplicate public `<main>` landmarks | **Fixed locally** | Replaced nested page-level main landmarks with sections/containers; standalone SSO screens keep their own main landmark. |
| Announcement/banner scope | **Fixed locally** | Division-targeted CMS banners now respect their division, and generic event-booking banners are suppressed on irrelevant division pages, including Travels. |
| Number foil balloon variation bypass | **Fixed locally** | Number foil balloons without configured choices now require selection of a digit from 0–9 in both catalog and Mart flows; Mart card quick-add opens product details instead. |
| Product modal keyboard accessibility | **Improved locally** | Product dialogs now have labelled dialog semantics, Escape-to-close, focus trapping, initial focus, and focus restoration. |
| Mobile image zoom is excessively cropped | **Fixed locally** | Shared touch zoom for gallery, services, and products now uses 1.4× instead of 2.5×; desktop zoom remains unchanged. |

**Current code quality checks:** TypeScript type-check and production build pass. The local build lacks Turso credentials, so dynamic sitemap data fell back to static public routes; deployment builds should use the configured production database.

## Prioritized findings

| # | Priority | Finding | Evidence / impact | Confidence |
|---|---|---|---|---:|
| 1 | **P0 — conditional launch blocker** | Documented custom domains do not resolve. | `mahdev.lk`, `sws.mahdev.lk`, `u1.mahdev.lk`, `it.mahdev.lk`, `travels.mahdev.lk`, and `mart.mahdev.lk` returned DNS `NXDOMAIN`. The corresponding Vercel aliases returned HTTP 200. If the custom domains are the intended production entry points, customers cannot reach the site there. The setup doc describes these domains as pending purchase/configuration, so confirm launch intent before treating this as a regression. See [DOMAIN_CONFIGURATION.md](./DOMAIN_CONFIGURATION.md). | 10/10 |
| 2 | **P1** | Travels landing page contains SWS copy. | The live Travels page says “From luxury wedding mandaps…concert arenas, SWS is Mahdev’s primary flagship division.” This is incorrect for a travel division and is also used as the coming-soon SEO description. The page otherwise correctly identifies Travels as “Coming Soon.” Review the CMS `comingSoonMessage` consumed in [DivisionComingSoonView.tsx](./src/views/DivisionComingSoonView.tsx). | 10/10 |
| 3 | **P1** | Travels launch-alert form can report a false success. | In [DivisionComingSoonView.tsx](./src/views/DivisionComingSoonView.tsx), the catch branch logs an inquiry-save error and still sets `isSubscribed` to true. A failed write therefore appears successful and can silently lose launch leads. | 10/10 |
| 4 | **P1** | Corporate contact form confirms before persistence. | [ContactCorporateSection.tsx](./src/components/corporate/ContactCorporateSection.tsx) sets the success state and creates a reference before the contact save completes; save failures are only logged. The user can receive an “Inquiry Successfully Logged” message even when persistence fails. | 9/10 |
| 5 | **P2** | Mart shows five-star ratings with no reviews. | The live product cards show `5 (0)` for products. [martData.ts](./src/data/martData.ts) defaults a missing rating to `5.0` and a missing review count to `0`, presenting unrated items as five-star products. Display “No reviews”/no rating until a real rating exists. | 9/10 |
| 6 | **P2** | Delayed WhatsApp invitation obscures mobile page content. | The shared invitation appears after 10 seconds and is fixed over the page; screenshots showed it covering hero text on the corporate and division sites, alongside the floating WhatsApp launcher and bottom navigation. See [WhatsAppWidget.tsx](./src/components/common/WhatsAppWidget.tsx). It is dismissible, but its placement competes with the primary content and CTA on a short mobile viewport. | 10/10 |
| 7 | **P3** | Home hero image is preloaded on division pages but reported unused. | The browser logged an unused-preload warning for `/assets/hero_landing_poster.jpg` on several division aliases. [index.html](./index.html) marks this preload as home-only; verify the deployed prerender output removes it on non-home routes to avoid unnecessary priority/bandwidth. | 9/10 |

## UX scorecard and ranking

Scores are heuristic manual scores for the Vercel preview experience, based on page clarity, navigation, content quality, trust, and mobile usability—not Lighthouse or lab performance scores.

| Rank | Site | Score | UX assessment |
|---:|---|---:|---|
| 1 | Corporate Mahdev | **8.2/10** | Strong group identity, clear division discovery, useful contact path, and a working mobile navigation drawer. The delayed WhatsApp card interrupts the first-screen hero. |
| 2 | SWS Event Management | **7.9/10** | Rich service and rental inventory, useful search/filtering, and strong contact affordances. The 224-item result set is dense, so filtering and information hierarchy matter. Search returned a clear zero-results state and recovered after clearing the query. |
| 3 | U1 Studio | **7.6/10** | Clear photography/cinema positioning and visible portfolio/service content. The mobile page is visually strong, though the fixed WhatsApp invitation competes with the hero and portfolio. |
| 4 | Mahdev IT Solutions | **7.4/10** | Direct enterprise-software positioning and a clear “Explore Services” path. Case studies and proof points should be prominent early so technical claims are backed by examples. |
| 5 | Mahdev Online Mart | **6.8/10** | Product search, categories, price controls, stock, and add-to-cart affordances are visible. The observed six-product catalog is narrow, and `5 (0)` ratings undermine trust. Cart/checkout completion was not verified. |
| 6 | Mahdev Travels | **4.1/10** | The coming-soon status and WhatsApp inquiry path are clear, but SWS copy is a major relevance/trust break and the launch-alert save failure can produce false confirmation. This is not yet a booking-ready travel experience. |

**Initial preview-wide UX score: 7.3/10.** This scorecard reflects the live pages before the local UX fixes above; the fixes have not been deployed or rescored on the public URLs. If the custom domains are expected to be production-ready, domain reachability overrides the preview scores and remains a release gate.

## Test coverage

### Completed

- Probed the corporate and five division Vercel aliases; all returned HTTP 200.
- Loaded and reviewed the corporate homepage, contact page, and the SWS, U1, IT, Travels, and Mart landing pages.
- Opened the corporate mobile navigation and confirmed the expected corporate and division links are present.
- SWS service search: an unmatched query showed a clear zero-results message; clearing it restored the 224-item result count.
- Corporate contact form: an empty submission displayed the expected name, email, and project-detail validation errors; no inquiry was submitted.
- Inspected the Travels launch-alert form fields and confirmed the email field is marked required.
- Checked the six documented custom-domain hostnames via direct requests and Google Public DNS-over-HTTPS; all returned `NXDOMAIN`.
- Reviewed screenshots at the available short mobile viewport. The browser runner did not provide a reliable desktop viewport in this session.
- After the code changes, locally confirmed the Travels fallback copy no longer references SWS and that the WhatsApp invitation does not appear automatically.
- Follow-up mobile-width browser check: the WhatsApp unread badge appeared after its delay; when visible, the back-to-top control was positioned above it. Opening the support chat clears the badge.
- Follow-up mobile-width scroll check: the service detail content scroll position advanced from 0 to 228px without trapping the page.
- Follow-up image interaction check: service detail images magnified around the desktop pointer, showed the focus marker, and toggled magnification on tap at mobile width.
- Follow-up change: reduced shared mobile image zoom to 1.4× across gallery, service, and product viewers while retaining the full-screen image presentation.
- With dummy Firebase configuration and an unavailable local API, exercised both contact and launch-alert failure paths: each displayed a retryable error and neither showed a success confirmation. No real inquiry was created.
- Rechecked empty corporate-form submission locally: inline required-field errors appeared.
- Ran `npm run typecheck`, `npm run build`, and `git diff --check` successfully. The build's sitemap script logged a missing-local-Turso warning and completed with the documented static-route fallback.

### Not covered / limitations

- No successful contact or launch-alert persistence was tested because the local environment has no configured database. No live inquiries, bookings, orders, or payments were created.
- Authentication, account recovery, admin flows, API failure injection, and complete keyboard/screen-reader testing were not performed.
- The browser runner could not stabilize some animated controls for automated clicking. Cart/checkout behavior is therefore **not verified**, not marked failed.
- Some third-party telemetry/reCAPTCHA requests were aborted during browser navigation; these were not counted as product defects.
- No Lighthouse/Core Web Vitals run or cross-device browser matrix was available.
- The current local preview could serve the built shell but could not mount the client application because Firebase client configuration is not available in this environment; the newly changed UI interactions therefore still need live-browser verification after deployment.
- Full success-path verification for contact submission and Travels launch-alert registration still requires a configured test database and mail gateway.

## Remaining release actions

1. Decide whether the custom domains are in scope for launch; if yes, configure DNS/hosting and recheck all six HTTPS hosts.
2. Deploy the local code fixes, then repeat browser checks on the live URLs.
3. Use a configured test database to verify successful inquiry persistence, confirmation references, and notification/email delivery.
4. Complete desktop/mobile and keyboard/screen-reader testing, followed by a Lighthouse/Core Web Vitals run.
