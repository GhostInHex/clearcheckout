# Verification record

Verified locally on 2026-11-04 after merging the Meta integration and extension repair cleanup.

- `npm run build` passed and produced the Vite app and MV3 zip.
- `npm test` passed 18 account, payment, provider-request, media-format, shared-budget, cache, throttle, HTTPS-proxy, and durable-budget tests. Provider responses in these tests are mocked.
- `npm run test:browser` passed the connected Chromium signup, onboarding, preference persistence, repair, cart-change, review, and simulated-confirmation journey. Axe assertions passed on landing, signup, onboarding, dashboard, preferences, confirmation, and completion. No page errors or mobile horizontal overflow were observed.
- `npm run test:dom` passed real Chromium regressions for unnamed forms, changed action text, attribute mutations, rerenders, merchant overrides, and idle observation.
- `npm run test:extension` passed injection, label repair, focus on opening, focus restoration on close, enlarged guidance text, cleanup, and reopened-panel action changes. The fixture adds test-only localhost permission. The real toolbar gesture remains a manual check.
- `npm run test:meta-browser` passed unconfigured behavior, consent, plain-text output, cache, and invalidation against a mocked provider. It makes no live calls.
- `npm run test:meta-live` passed through the shopper UI using the saved server-side key. The uncached `muse-spark-1.3-contributor` response returned HTTP 200 at 2026-11-04T20:50:38.125Z. The AI response appeared beside the trusted $42.00 demo total. The result and screenshot are in `artifacts/meta-live-verification.json` and `artifacts/meta-live.png`. Rerunning this command consumes API credits.

Fresh reviewer agents reproduced the original accessibility defects. Parent fixes passed the targeted reproductions. A final review of Meta integration and close/reopen cleanup passed with no verified material issues. The subsequent media additions are awaiting fresh review.

These automated checks do not establish WCAG conformance, production security, universal merchant compatibility, or screen-reader usability. No public deployment or real payment has been verified. No secret is stored in this record or tracked source.

Media API verification on 2026-11-04 generated a 1,758,773-byte PNG through Muse Image 1.0. Live SAM 3.1 returned a mug box from (255,337) to (979,1016) in the 1920×1280 source image. Live Muse Voice Transcribe returned `go to cart` from nonprivate synthesized speech. The generated image was visually inspected and contains a separated mug and tea box. SAM renders bounding boxes, not decoded masks.

`npm run test:media-browser` passed mocked UI checks for transcript review, focus-only navigation, rejection of payment speech, highlights, and magnification. `npm run test:microphone` passed Chromium simulated-device checks for explicit Stop, component unmount, ten-second automatic stop, and no unapproved upload. Physical microphone and real assistive-technology testing remain unverified.

`npm run test:media-live-browser -- /tmp/clearcheckout-command.wav` passed the live shopper UI at 2026-11-04T21:01:43.207Z. Voice returned HTTP 200 with `Go to cart`; Apply moved focus while order state remained draft. Cached Muse Image content loaded with HTTP 200, and live SAM returned HTTP 200 with one rendered highlight and a visible magnified region. Nonsecret results are in `artifacts/media-live-verification.json`; screenshots are `artifacts/voice-live.png` and `artifacts/visual-live.png`. Transcription can vary between calls; unknown transcripts must leave the order untouched.

The media review found one cache recovery defect. Parent moved image and SAM dimension validation before success caching, added recovery for old invalid cached results, and verified both explicit retries and retained reservations. The new recovery regressions pass. A fresh recheck passed the invalid-image and legacy-SAM cache recoveries with reservations retained and no material findings.

The published HTTPS demo passed the full `test:browser` journey after configuring the exact PUBLIC_ORIGIN, secure cookies, and loopback proxy trust. Signup, onboarding, saved preferences, repair, review, and simulated confirmation passed with zero reported axe violations or page errors. A regression test rejects foreign and malformed Origin headers despite forwarded host/protocol headers.
