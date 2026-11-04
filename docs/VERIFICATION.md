# Verification record

Verified locally on 2026-11-04 after merging the Meta integration and extension repair cleanup.

- `npm run build` passed and produced the Vite app and MV3 zip.
- `npm test` passed 12 account, payment, provider-request, cache, throttle, and durable-budget tests. Provider responses in these tests are mocked.
- `npm run test:browser` passed the connected Chromium signup, onboarding, preference persistence, repair, cart-change, review, and simulated-confirmation journey. Axe assertions passed on landing, signup, onboarding, dashboard, preferences, confirmation, and completion. No page errors or mobile horizontal overflow were observed.
- `npm run test:dom` passed real Chromium regressions for unnamed forms, changed action text, attribute mutations, rerenders, merchant overrides, and idle observation.
- `npm run test:extension` passed injection, label repair, focus on opening, focus restoration on close, enlarged guidance text, cleanup, and reopened-panel action changes. The fixture adds test-only localhost permission. The real toolbar gesture remains a manual check.
- `npm run test:meta-browser` passed unconfigured behavior, consent, plain-text output, cache, and invalidation against a mocked provider. It makes no live calls.
- `npm run test:meta-live` passed through the shopper UI using the saved server-side key. The uncached `muse-spark-1.3-contributor` response returned HTTP 200 at 2026-11-04T20:50:38.125Z. The AI response appeared beside the trusted $42.00 demo total. The result and screenshot are in `artifacts/meta-live-verification.json` and `artifacts/meta-live.png`. Rerunning this command consumes API credits.

Fresh reviewer agents reproduced the original accessibility defects. Parent fixes passed the targeted reproductions. A final review of Meta integration and close/reopen cleanup is pending.

These automated checks do not establish WCAG conformance, production security, universal merchant compatibility, or screen-reader usability. No public deployment or real payment has been verified. No secret is stored in this record or tracked source.
