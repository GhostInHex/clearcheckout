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

Only demo cart quantities, delivery selection, and the exact confirmation phrase reach the order API. DOM scanning does not read input values or upload page contents. Passwords are transmitted only to the local account API. No AI or payment provider is configured. No real payment is verified.

This is a local submission, not a production security or universal accessibility guarantee. Password recovery, email verification, subscription billing, voice input, AI adapters, PayPal, universal store compatibility, and real payments are deferred. Guidance does not replace a shopper's screen reader. The extension cannot access cross-origin frames or closed shadow roots. Rate limits are process-local. Account creation has no email ownership check. Production operation needs HTTPS, backups, monitoring, abuse controls, deployment hardening, and independent security and assistive-technology review.
