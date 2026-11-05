# P02 service extraction checkpoint

P02 is incomplete. This checkpoint starts from dependency commit `3ab9e3000458972265ccffa247d2a46e77945de3` in `/data/home/.t3/worktrees/clearcheckout/t3-3bb107db`, branch `t3/implement-nextjs-app-router`. P01 remains independently unverified. No push, PR, deployment, merge, live model call, credentials access, or production database access occurred.

## Implemented boundary

`server/service.ts` owns SQLite initialization, account credentials, hashed session storage, authentication, revocation, preferences, order ownership, daily limits, checkout transitions, and provider lifecycle. It imports no HTTP framework. Inputs crossing from untyped credential and preference bodies use Zod. Public user and checkout response shapes use shared runtime schemas. `ServiceError` carries intentional public status and message pairs without exposing arbitrary database errors.

`server/app.ts` delegates account and order operations to that service. Existing middleware still owns origin and header checks, cookies, body bounds, throttles, authentication order, security headers, raw WAV handling, media responses, and static downloads. It remains the existing Express application during this checkpoint. It must be removed when its callers are migrated, not kept as a Next compatibility adapter.

The two designs considered in-thread were extracting a framework-independent service first and rewriting all handlers directly into Next. The service extraction makes the persistence and checkout behavior reusable by actual Route Handlers and permits comparison against the existing HTTP tests. Model the Domain kept persistence and session ownership in one factory. Type System Discipline reused public schemas and distinguished intentional service failures from unexpected exceptions. No children ran, per the implementation brief.

## Verification receipts

Logs reside under `artifacts/program/P02/service-boundary/`. These are local ignored artifacts. Browser suites ran sequentially after the build. Screenshots copied from the shopper run reside in its `screenshots/` directory.

- `npm run typecheck` checks the complete existing strict source inventory, including the new service and test.
- `npm run lint` enforces the existing assertion and suppression bans.
- `npm test` passes 20 tests. The new direct-service case covers session hashing and expiry, logout, database reopen, ownership, review invalidation, exact confirmation, and completed-demo persistence.
- `npm run build` builds the existing Vite frontend, compiled Node server, and separate TS MV3 extension. This is not a Next build.
- `npm run test:regression` runs the shopper, DOM, installed extension, mocked explanation, media and microphone suites sequentially against isolated databases and ephemeral fixture ports, without loading .env.
- `COMPILED_TEST_PORT=3493 npx tsx scripts/verify-compiled-server.ts` checks actual compiled `npm start`, restart persistence, downloads, session cookies, no-store, and 400, 409, 413 and 503 status contracts. This remains an Express production artifact check.

Independent DeepSeek and GLM reviews remain root-owned and were not run. Manual toolbar activeTab, hosted CI, Next parity, ten live lanes, and performance comparison are unverified.

## Next owner

Session scope and context limits require a fresh owner to finish the framework migration. No Next package is installed and no partial Next entry point is checked in.

1. Confirm this checkpoint head and inspect its diff against the dependency. Re-read the P02 plan, P01 checkpoint, service, app, client schemas, views and all scripts/tests importing createApp.
2. Select and install supported Next and React versions. Official documentation inspected this session is https://nextjs.org/docs/app/getting-started/installation and https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx. It specifies Node 20.9 or newer and React 19 support in App Router. Node 22 matches this project's target. Recheck exact package versions before installation.
3. Implement real typed Node-runtime Route Handlers over this service. Preserve every existing status/body contract, middleware order where observable, JSON 8kb and WAV 500kb limits, cookie flags, origin/header checks, throttles, no-store, streaming provider boundaries, durable ledger and media lifecycle. Add real Next integration tests rather than an Express-shaped emulation.
4. Move landing, auth, onboarding, dashboard, preferences and demo into App Router routes with client-only DOM and microphone ownership. Preserve URLs and verify direct loads and navigation. Keep shared DOM and checkout Next-independent. Verify client bundles exclude Node, SQLite and credentials.
5. Migrate all createApp tests, browser fixtures, compiled restart verifier and regression runner to the reusable service or actual Next process as appropriate. Replace server entry and npm scripts, remove Express/Vite and obsolete configs after callers migrate. Maintain whole-repository strict coverage and lint.
6. Migrate vercel.json away from Vite and the external sandbox API rewrite. Migrate copy-vercel-downloads.ts and preserve video, captions, source archive, extension archive and unpacked extension URLs.
7. Build Next first, run browser suites sequentially, run actual isolated Next production start/restart/data/download checks and save receipts under artifacts/program/P02. Obtain root-owned independent reviews before calling P02 code-ready or verified.

## Deployment constraint

The target is one persistent Node 22 process with a mounted persistent SQLite database directory and persistent generated-media directory. The durable AI ledger must share that database across restarts. Terminate TLS at the host proxy, configure approved public origins and secure cookies, and arrange consistent SQLite backups before any cutover. Next Route Handlers using better-sqlite3 require the Node runtime. Vercel Functions local storage is not a durable deployment target for this design. P06 owns hosting and deployment. No deployment is authorized here.

## Next runtime checkpoint (2026-11-05)

This supersedes “No Next package is installed” above. P02 remains INCOMPLETE, not code-ready. This bounded unit installs Next 16.4.5 and React/React DOM 19.3.1. Official installation documentation (https://nextjs.org/docs/app/getting-started/installation, inspected this session) requires Node >=20.9, describes React 19 App Router support, and documents `next build`/`next start`; the machine runs Node 22. Next's declarations require the ES2024 Promise library; strictness remains enabled, allowJs and skipLibCheck remain false.

Production commands now build and start Next. App Router pages cover `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`, `/preferences`, and `/demo`. The existing client owns DOM, focus, recorder, and media lifecycle. Navigation records URLs and handles popstate. Metadata and language live in the root layout. Node-runtime API handlers call the reusable service behind a server-only import. SQLite and provider code are excluded from the browser graph. Extension compilation remains separate; the build copies its unpacked files and archive to public. Video and captions remain in public.

Evidence under ignored `artifacts/program/P02/next-runtime/`: build-final.log, start.log, browser.log, api.log, unit.log, typecheck-final.log, lint-final.log, demo-desktop.png and demo-mobile.png. The actual production process binds only 127.0.0.1:3497, DB_PATH=/tmp/cc-p02-next-runtime.sqlite, secure cookies disabled for loopback, no live provider keys. The shopper suite exercises signup, onboarding, saved preferences after reload, demo review invalidation and exact confirmation with axe scans and mobile overflow checks. `scripts/verify-next-api.ts` tests actual Next signup/session/preferences, early-confirmation 409, missing order 404, oversized JSON 413 and missing request header 403. Existing 20 unit tests pass against their original reusable-service/Express fixtures; those are not Next parity evidence.

Outstanding before code-ready:

- Replace the temporary global conservative request/auth counters with equivalent per-client throttles and draft-8 rate limit headers; the current adapter does not claim throttling parity.
- Complete Helmet-equivalent security headers including Next-compatible CSP, malformed-origin status parity, body/parser ordering and all raw WAV/provider fault contracts with real Next tests.
- Migrate all browser provider fixtures and compiled restart verifier from Express to actual Next or direct reusable service. Run all regression suites against Next, verify restart persistence and durable ledger/media behavior, then delete Express, Vite, their dependencies/configs, obsolete server entry, and build:legacy. Express currently remains solely as the incomplete fixture baseline.
- Restore source archive URL via an explicit redirect or generated archive; verify extension/download/video/captions contracts end to end. Replace the obsolete build:vercel copy script and update deployment documentation.
- Strengthen direct protected-route/session navigation checks and back/forward behavior. Run independent root-owned reviews, ten live lanes and performance checks. None has run here.

`vercel.json` now selects Next and removes the sandbox API rewrite. This is configuration only, not deployment authorization. Durable hosting still requires one persistent Node process, persistent mounted SQLite and generated-media directories, backup policy, approved origins and TLS/secure cookies. Vercel Functions ephemeral storage cannot provide these guarantees. No deployment, public listener, live provider request, production DB access, push or PR occurred.

Type System Discipline kept response checks schema-derived and source free of assertions. Prove It Works required actual production Next HTTP and browser execution rather than treating the legacy test suite as migration proof.

Final verification: `npm run build`, `npm run typecheck`, and `npm run lint` exited 0. The final rebuilt production process was restarted on loopback 3497 using the same isolated database. `api-final.log` and `browser-final.log` both pass; the latter reports zero axe violations and zero page errors. Screenshots were refreshed from that final run. `npm test` reports 20/20 passing. Restart persistence was not specifically asserted by a test, so restarting the process alone does not close that outstanding verification box. npm installation reported nine moderate dependency advisories; no forced dependency audit fix was attempted.
