# ClearCheckout submission handoff

ClearCheckout helps blind and low-vision shoppers explore a checkout with local label repair, keyboard guidance, approved AI explanations, reviewed voice navigation, and visual magnification.

## Submission links

- Demo (Vercel, recommended for judges): https://clearcheckout-one.vercel.app
- Demo (sandbox, direct backend): https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech
- Source archive: https://clearcheckout-one.vercel.app/clearcheckout-source.zip (redirects to GitHub `main`; the latest documentation-only commit may lag)
- Video: https://clearcheckout-one.vercel.app/clearcheckout-submission.mp4
- Captions: https://clearcheckout-one.vercel.app/clearcheckout-captions.srt
- Chromium extension: https://clearcheckout-one.vercel.app/clearcheckout-extension.zip
- Source archive (current, sandbox): https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech/clearcheckout-source.zip

The Vercel frontend proxies `/api/*` to this sandbox. Both demo URLs stop working when the sandbox stops; this is not permanent independent hosting. The `clearcheckout-demo` user service restarts on process failure. Preserve `data/` and the private server configuration. The Vercel source link resolves to the GitHub `main` archive, so only committed files are included.

## Judge walkthrough

1. Create an account with a synthetic email address and a password of at least ten characters.
2. Save reading preferences and open the demo store.
3. Scan and repair the intentionally unnamed cart summary control.
4. Approve the demo order summary and request a Muse Spark 1.3 Contributor explanation. Contributor prompts and responses may be used for training. Verify the separately displayed trusted total.
5. Record or select a supported WAV command. Sending it to Muse Voice Transcribe requires explicit approval. Review the transcript before applying navigation. Voice never changes or confirms an order.
6. Load the saved Muse Image illustration. Select the mug or tea box, then locate it with SAM 3.1 for a highlighted and magnified region. The art does not verify product appearance, and SAM does not understand arbitrary checkout controls.
7. Review the order and manually type the exact displayed confirmation phrase. The resulting payment is simulated. No money moves or merchant order is placed.

Uncached model calls share a 30-second per-account cooldown, a durable app-wide $5 allowance, and a maximum of 100 attempts. Failed calls retain their reservation and do not retry automatically. Cached results do not consume another reservation.

## Scope and evidence

The code includes persisted local accounts, sessions, preferences, order history, the embedded store, and an installable MV3 companion. All four Meta models have passed live checks, and the Vercel production URL passed the full signup-to-confirmation browser journey. Eighteen tests, browser journeys, automated accessibility checks, and fresh reviewer passes are recorded in `docs/VERIFICATION.md`.

The app has not completed testing with blind or low-vision participants using their own assistive technology. Payments, subscription billing, password recovery, email verification, universal merchant compatibility, and production operation are outside this submission. See `README.md` for exact limitations. Do not claim a production security audit or WCAG conformance.

The source archive excludes the API key, SQLite database, installed dependencies, and generated runtime data. Judges can run the app with `npm ci`, `npm run build`, and `npm start`. Local assistance works without a provider key. Optional model features need server-side Meta configuration.

The final walkthrough is approximately 2 minutes 20 seconds, recorded from the public app with synthetic narration and captions. Model wait periods are cut between sections. It shows the corrected formatted-dollar explanation and actual voice/SAM responses. No credentials or real shopper data appear in it.
