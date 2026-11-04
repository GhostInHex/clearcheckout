# ClearCheckout

ClearCheckout helps blind and low-vision shoppers explore a clearer checkout. This submission includes real local accounts, saved reading preferences, a guided demo store, and a Chromium MV3 extension.

## Run locally

Requires Node 22 and a system `zip` command.

```sh
npm ci
npm run build
npm start
```

Open http://localhost:3000. No secrets, provider account, or card details are needed. SQLite initializes automatically in `data/clearcheckout.sqlite`. Preserve that directory across restarts. Set `DB_PATH` to change its location. Set `COOKIE_SECURE=true` behind HTTPS. Do not expose the local HTTP configuration publicly.

For frontend development, run `npm run dev` and `npx vite` in separate terminals. Vite proxies API calls to port 3000.

## Try the complete journey

1. Create an account with a password of at least ten characters.
2. Choose reading size, contrast, and guidance detail. Save your preferences.
3. Open the demo store from the dashboard.
4. Scan controls. Repair the deliberately unnamed cart summary button.
5. Use the repaired button or move to cart, delivery, and review with Alt Shift C, D, and R.
6. Review the order and type the exact displayed confirmation phrase. Change delivery after review to see confirmation invalidated.
7. Complete the simulated payment, or select the failure test option. No real order is placed and no money moves.
8. Sign out and sign in again. Your preferences and demo history remain associated with your account.

## Install the extension

Build first. Unzip `build/clearcheckout-extension.zip`, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**. Select the unzipped folder, or `build/extension` directly. Select the extension icon on an ordinary web page to open its accessible panel.

The extension requests `activeTab`, `scripting`, and `storage`. It activates on user action and does not request access to every site. Scanning and repair run locally. Reliable `title` or explicit `data-checkout-label` context can supply missing names. Unknown controls remain unchanged. Repairs observe DOM rerenders while assistance is open. Closing assistance removes its own injected labels and preserves merchant-provided labels. Keyboard navigation supports explicitly marked cart, delivery, and review sections. It does not infer arbitrary merchant workflows or submit payments. Restricted browser pages do not allow injection.

The embedded demo and extension bundle share `shared/dom.js` for scanning, repairs, observation, and commands. `shared/checkout.js` defines the exact-confirmation domain rules enforced by the API. Merchant payment execution is intentionally absent from the extension.

## Verify

```sh
npm test
npx playwright install chromium
npm run build
npm start
# In another terminal
npm run test:browser
npm run test:dom
npm run test:extension
```

Browser verification writes screenshots and the actual axe violation report to `artifacts/`. Automated accessibility checks are not a screen reader audit.

## Security and limits

Passwords use salted scrypt hashes. Opaque session tokens are hashed in SQLite, expire after seven days, and use HttpOnly SameSite Strict cookies. Requests require an application header and matching Origin when supplied. JSON bodies are bounded. Authentication and API requests are rate limited per IP. Demo orders are limited to 50 per account per day. Orders and preferences are isolated by user ID. SQLite initialization is idempotent and sets schema version 1.

Only demo cart quantities, delivery selection, and the exact confirmation phrase reach the order API. DOM scanning does not read input values or upload page contents. Passwords are transmitted only to the local account API. Meta AI is optional and server-configured. No payment provider is configured and no real payment is verified.

This is a local submission, not a production security or universal accessibility guarantee. Password recovery, email verification, subscription billing, voice input, AI-based control labeling, PayPal, universal store compatibility, and real payments are deferred. Guidance does not replace a shopper's screen reader. The extension cannot access cross-origin frames or closed shadow roots. Rate limits are process-local. Account creation has no email ownership check. Production operation needs HTTPS, backups, monitoring, abuse controls, deployment hardening, and independent security and assistive-technology review.

## Optional official Meta AI order explanations

The demo clarity panel includes **Explain with Meta AI**, using the official Meta Model API and `muse-spark-1.3-contributor`. Copy `.env.example` to `.env` and privately set `MODEL_API_KEY`, or set `MODEL_API_KEY_FILE` to a private UTF-8 file. `server/index.js` loads the working directory's gitignored `.env` at startup with Node's `process.loadEnvFile`; existing environment variables take precedence. Restart after changing configuration. The key stays on the server. Never use a `VITE_` key variable.

Before asking Meta, shoppers approve sharing the demo items, authoritative prices, delivery, checkout state, revision, and guidance detail. Contributor prompts and responses may be used by Meta for training. No account email, password, session token, arbitrary customer prompt, field values, or screenshots are forwarded. Local control repairs continue to run without AI. AI text is advisory, rendered as React text, and cannot execute tools, modify orders, or confirm payment. The trusted app total remains separately visible.

The SQLite `ai_calls` ledger permanently reserves $0.05 **before every attempted provider request**, inside an immediate transaction. Reservations survive errors, ambiguous timeouts, and restarts and are never refunded. The default $5 app allowance permits at most 100 attempts; `META_AI_BUDGET_USD` and `META_AI_CALL_LIMIT` can lower these limits but cannot raise them above $5 and 100. Each user is throttled to one uncached attempt per 30 seconds. Successful explanations are cached by user, authoritative order contents/revision/state, guidance mode, model, and prompt. Cached reads do not consume another reservation. Missing or out-of-bounds usage pauses new calls persistently in `ai_safety`. No automatic retries occur. Transport failures retain their reservation.

Published Contributor rates are $0.10 per million input tokens and $0.20 per million output tokens (cached input $0.002 per million). We conservatively retain the full reservation rather than reconcile credits. Inputs are restricted to a fixed catalog summary and a 4096-byte prompt bound. Output is limited to 2048 tokens including reasoning; reported input usage must be at most 8192 tokens. Requests time out after 20 seconds. This cap covers this app instance's shared SQLite ledger only, not the entire Meta account. Preserve the database across restarts and share it across workers. Deleting/replacing it resets the allowance. Other apps, database copies, future price changes, and requests outside this ledger are not protected by this app cap. Configure account-side limits separately if available.

Official sources: [Quickstart](https://dev.meta.ai/docs/quickstart), [Responses reference](https://dev.meta.ai/docs/api-reference/responses/create-response), [Pricing and contributor data terms](https://dev.meta.ai/docs/pricing-rate-limits). Provider transport tests use explicitly mocked responses, not live inference. A configured key is not evidence of a successful live call; live verification must be recorded separately. Without a key the UI clearly says Meta AI is not configured and never substitutes fake AI output.

Live Meta inference was verified through the shopper UI on 2026-11-04 using `muse-spark-1.3-contributor`. The uncached request returned HTTP 200. Run `npm run test:meta-live` only against a configured local server when you intend to consume API credits. It creates a test account and makes one live request; its nonsecret result and screenshot are saved under `artifacts/`.

## Voice and visual assistance

The demo includes opt-in Muse Voice Transcribe navigation and a reusable Muse Image illustration explored with SAM 3.1. See [multimodal setup, safety boundaries, and live verification](docs/MULTIMODAL.md). These integrations have mocked browser coverage and verified live calls: image generation, SAM mug detection, and transcription all returned HTTP 200, and the integrated UI focus-only navigation passed. Physical microphone and real assistive-technology testing remain unverified.

## Hosted submission demo

https://clearcheckout-one.vercel.app is the judge-facing deployment. Vercel serves the static frontend and forwards `/api/*` to this sandbox, so the sandbox must stay running. Signup, saved preferences, repair, review, simulated confirmation, and a live Meta explanation were verified through that URL on 2026-11-04.

The reviewed submission is also available at https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech while the sandbox runs. Source and extension archives are served at `/clearcheckout-source.zip` and `/clearcheckout-extension.zip`. The Vercel source archive redirects to the GitHub `main` branch archive. The server runs as the user service `clearcheckout-demo`; restart with `systemctl --user restart clearcheckout-demo`. Its runtime enables secure cookies. `PUBLIC_ORIGIN` must match the exact public HTTPS origin when a proxy rewrites Host. `TRUST_PROXY=loopback` trusts only a local reverse proxy; leave it unset for direct local development. A bare local HTTP browser session cannot use the hosted service’s secure cookies.

The narrated submission video is available at `/clearcheckout-submission.mp4`, with sidecar captions at `/clearcheckout-captions.srt`. See `docs/SUBMISSION-HANDOFF.md` for all links, judge steps, and limitations.
