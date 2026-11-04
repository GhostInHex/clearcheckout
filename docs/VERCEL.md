# Vercel submission deployment

Production URL: https://clearcheckout-one.vercel.app

Vercel hosts the static React frontend, video, captions, and extension download. Exact `/api/*` rewrites forward authenticated requests to the existing HTTPS backend. SQLite accounts, media, the server-only Meta key, and the durable shared spending ledger remain on the sandbox. The sandbox must stay running. This deployment does not migrate the backend into Vercel Functions.

The verified Vercel routing behavior is documented at https://vercel.com/docs/routing/rewrites. External-origin rewrites preserve the frontend URL while forwarding the request. Native local SQLite and generated files must not be treated as durable Vercel Function storage.

Build with Node 22 using `npm ci` and `npm run build:vercel`. Vercel's source build uses `vercel.json`. The video and captions are tracked public assets, and the extension archive is copied into `dist` after its build. The source archive route points at the GitHub main-branch archive.

A prebuilt deployment can instead use `.vercel/output/static` containing the built `dist` and `.vercel/output/config.json` with API routing. Neither the source build nor prebuilt frontend requires the Meta key. Never upload `.env`, databases, runtime media, or credential files.

The backend operator added `https://clearcheckout-one.vercel.app` to the comma-separated `PUBLIC_ORIGINS` value and restarted `clearcheckout-demo`. The original `PUBLIC_ORIGIN` keeps the instabox demo authorized. Future preview deployments need their own exact allowlist entry; arbitrary `*.vercel.app` origins must not be trusted.

## Verification (2026-11-04)

`BROWSER_BASE_URL=https://clearcheckout-one.vercel.app npm run test:browser` passed the full production journey: signup, onboarding, saved preferences, repair, review, and simulated confirmation, with zero reported axe violations and no page errors. A separate authenticated request through the Vercel proxy created an account and demo order, then returned a live `muse-spark-1.3-contributor` explanation with the expected $24.00, $18.00, $42.00, and $0.00 amounts.

The demo and video returned HTTP 200. The extension archive returned HTTP 200. The source route returned a redirect to the GitHub `main` archive, which only includes committed files. Frontend-only HTTP 200 is insufficient; re-verify signup, saved preferences, order review, simulated confirmation, and downloads after any deployment or backend restart. Public-origin validation and secure cookies must remain enabled.
