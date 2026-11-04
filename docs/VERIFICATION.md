# Verification record

`npm run build` produces the Vite production app and MV3 zip. `npm test` passes five tests covering account isolation, hashed password storage, login rejection, logout revocation, SQLite and session reopen persistence, exact amount confirmation, stale revision rejection, cancellation, and simulated failure.

`npm run test:browser` runs real Chromium through Playwright against the production build served on port 3000. It passes signup, onboarding, saved preferences after reload, DOM label repair, cart change after review, renewed review, and exact simulated-payment confirmation. The completed demo page has zero axe violations in this run. No browser page errors or mobile horizontal overflow were observed. This is one automated page check, not a WCAG conformance claim or a screen reader audit. Screenshots and the raw axe report are under `artifacts/` after running the command.

`node tests/extension-browser.js` uses the built MV3 extension with a test-only localhost host permission so automation can inject without a physical extension-toolbar click. The production manifest retains activeTab access only. The test loads the service worker, injects the panel, repairs a reliably titled control, and closes the panel. The actual toolbar gesture needs manual verification.

Independent review is owned by the parent. No deployment, PR, provider integration, real payment, or external message was performed.
