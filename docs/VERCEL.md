# Vercel submission deployment

Vercel hosts the static React frontend, video, captions, and extension download. Exact `/api/*` rewrites forward authenticated requests to the existing HTTPS backend. SQLite accounts, media, the server-only Meta key, and the durable shared spending ledger remain on the sandbox. The sandbox must stay running. This deployment does not migrate the backend into Vercel Functions.

The verified Vercel routing behavior is documented at https://vercel.com/docs/routing/rewrites. External-origin rewrites preserve the frontend URL while forwarding the request. Native local SQLite and generated files must not be treated as durable Vercel Function storage.

Build with Node 22 using `npm ci` and `npm run build:vercel`. Vercel's source build uses `vercel.json`. The video and captions are tracked public assets, and the extension archive is copied into `dist` after its build. The source archive route points at the GitHub main-branch archive.

A prebuilt deployment can instead use `.vercel/output/static` containing the built `dist` and `.vercel/output/config.json` with API routing. Neither the source build nor prebuilt frontend requires the Meta key. Never upload `.env`, databases, runtime media, or credential files.

After obtaining the production Vercel hostname, the backend operator must add that exact HTTPS origin to the comma-separated `PUBLIC_ORIGINS` value and restart `clearcheckout-demo`. The original `PUBLIC_ORIGIN` keeps the instabox demo authorized. Preview deployments need their own exact allowlist entry; arbitrary `*.vercel.app` origins must not be trusted.

Verify signup, saved preferences, order review, simulated confirmation, and downloads against the final production Vercel URL. A frontend-only HTTP 200 is insufficient. Public-origin validation and secure cookies must remain enabled.
