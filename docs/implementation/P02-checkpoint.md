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

## Security and runtime unit (2026-11-05)

P02 remains INCOMPLETE. This unit adds actual Next checks and does not treat the Express tests as Next parity evidence. Independent OpenCode DeepSeek/GLM review remains root-owned. No children, model requests, production data access, environment-file access, push, PR, deploy, or merge occurred. Only `.env.example` exists in this checkout. Tests pass a minimal environment and use temporary SQLite/media directories and loopback ephemeral ports.

`npm start` now runs `scripts/next-start.ts`, the documented Next custom-server API with `dev:false`. `npm run dev` uses the same socket boundary with `--dev`. The Node socket supplies client identity. Forwarded addresses are ignored unless TRUST_PROXY=loopback and the socket peer is loopback. The chain is walked from the nearest proxy until an untrusted address is reached. Each incoming request's internal identity headers are overwritten and signed with a process-random secret before entering Next. Route Handlers verify the signature and fail closed without this entry point. Running raw `next start` is unsupported. This is necessary because the Web Request API does not expose the socket peer. Official sources inspected were https://nextjs.org/docs/app/guides/custom-server and https://nextjs.org/docs/app/api-reference/file-conventions/route. Hosting must retain this entry point, its tsx runtime, and the existing single-process persistent-storage deployment constraint.

The adapter limits each IPv4 client or IPv6 /56 to 180 API requests/minute and shares a 30 requests/15 minutes auth bucket across signup/login. Draft-8 policy, remaining, reset, partition and Retry-After headers match express-rate-limit formatting. Expired buckets are removed on access. At 10,000 active buckets, new identities fail closed with 503 rather than evicting active clients and resetting their allowance. JSON is read through a bounded reader before API limits/origin/auth. WAV is read only after origin/auth and only at the transcribe route, bounded at 500 KiB. The service retains its stricter validated WAV size and format limits. Malformed and foreign origins return 403. Session creation retains HttpOnly, SameSite Strict, seven-day Max-Age and COOKIE_SECURE; clearing a session now retains the same flags. Responses retain no-store, including parser/auth/rate errors and unsupported methods.

Next configuration supplies CSP and the remaining Helmet headers across pages, assets and errors. CSP allows inline Next bootstrap scripts and styles, disables script attributes and object embedding, and restricts the default source to self. This is a compatibility CSP, not nonce-based strict CSP. Upgrade-insecure-requests is omitted for the isolated HTTP runtime. `/clearcheckout-source.zip` redirects explicitly to the repository main source archive. Extension ZIP/unpacked manifest, video and captions remain public. Anonymous direct protected routes and history navigation after logout resolve to the landing page. Authenticated history navigation resolves permitted pages.

`tests/next-provider-fixture.ts` is an explicit Node test preload, never imported by production code. It refuses NODE_ENV=production and requires an isolated temp path and fake key. It replaces outbound fetch only in that test process and refuses every non-provider URL. There is no HTTP control endpoint or production feature flag. Normal auth, ownership, consent-facing API flow, budget reservation and provider validation still execute. The fixture returns deterministic image/WAV/explanation responses, a provider HTTP failure and malformed usage. Final shopper verification runs the optimized Next build with NODE_ENV=production, no fixture preload and no model key.

Final receipts reside under ignored `artifacts/program/P02/security-parity/`. `build-final.log`, `typecheck-final.log`, `lint-final.log`, `unit-final.log`, `security-final.log`, `browser.log`, and `start.log` record the sequential checks. Strict whole-repository typecheck and lint pass without casts, suppressions or weakened options. Twenty legacy/service unit tests pass and remain labelled as such. The actual Next integration verifier passes parser/origin ordering, JSON/WAV bounds, secure cookies, cross-account ownership, 50 orders/day, provider caching/fault/malformed/cooldown/no retry contracts, five durable reservations of 50,000 micro-USD, restart session/preferences/orders/media/ledger persistence, expiry, source isolation, public downloads, draft-8 throttles, independent clients, and disabled proxy trust despite forged headers. The production browser journey passes signup through exact confirmation, Back/Forward, logout history and anonymous direct dashboard load. It reports zero axe violations and zero page errors. The test databases' exact paths are in security-final.log. Re-run with `npm run build` then `npx tsx scripts/verify-next-security.ts`.

Remaining work before full P02 parity and cleanup:

- Convert the remaining Express provider/browser fixtures and compiled-server restart verifier. Cover all media segmentation/stream/timeout/fault variants in actual Next, not only the explanation fault/malformed cases and successful image/WAV cases added here.
- Check compressed JSON, unsupported charset/content-encoding and aborted-body contracts against the legacy parser. These uncommon parser cases are not yet claimed equivalent.
- Add deterministic clock/capacity coverage for bucket expiry and memory saturation; boundedness is implemented but those limits were not filled or timed out in this integration run. IPv6 aggregation and multi-proxy-chain parity also need explicit runtime cases.
- Remove Express/Vite and obsolete configs, scripts, dependencies and fixtures once callers migrate. The adapter still reuses express-rate-limit's pure IPv6 key helper, which must be preserved or replaced before deleting that dependency.
- Replace obsolete Vercel download-copy/deployment docs. Review the explicit source redirect and CSP inline-script tradeoff during independent review. Validate development-mode startup separately.
- Run root-owned independent reviews, full regression lanes and the outstanding program checks before calling P02 code-ready.

Boundary Discipline kept HTTP validation in the adapter. Model the Domain represented rate state as client buckets and resolved permitted navigation centrally. Type System Discipline kept parsed response/SQLite checks schema-derived. Prove It Works required running the optimized Next process and production browser, including a real restart, rather than relying on framework-neutral tests.

## Final cleanup continuation (2026-11-05)

This section supersedes the fixture-migration status above. P02 remains INCOMPLETE and independently unverified. This is a runnable continuation checkpoint, not a code-ready verdict. No P03 migrations or P04 payment-domain code was imported. No children, deployment, push, PR, merge, live provider request, production database access or environment-file access occurred.

### Completed in this continuation

- Every test and script caller of `createApp` migrated. Accounts, configured proxy origins and authenticated explanation endpoints now exercise real Next HTTP. The redundant Express reopen test was consolidated into the existing direct-service reopen test and actual production restart verifier. The unit suite now has 19 tests.
- The six-suite regression runner starts isolated production Next with a minimal environment. Explanation and media browser suites start their own isolated Next processes with a guarded Node test preload. The preload refuses production mode and requires an isolated temporary path and fake key. It intercepts provider transport only. It supplies explanation text, PNG, transcription and SAM SSE while preserving authentication, ledger reservation, cache validation and cooldowns. The media browser no longer fulfills API routes in Playwright. Its 31-second waits retain the real provider cooldown.
- Explanation UI checks retain consent, plain-text rendering, provider-call count, cache reuse and revision invalidation. Media checks pass valid WAV through the actual adapter, reject unsafe transcribed commands in the UI and render real parsed segmentation geometry. Microphone checks use actual Next without automatic uploads.
- The historical `verify-compiled-server.ts` filename remains, but its command starts production Next through `npm start`. Readiness now checks HTTP instead of an obsolete Express log message. It verifies sessions and completed demo orders after a real restart and checks downloads and error contracts.
- Development startup now explicitly selects Webpack through the Next custom-server API. The initial dev probe exposed Turbopack failing the existing `.js` import aliases. A successful isolated dev probe follows the fix. The strict production config excludes `.next/dev` so generated global declarations do not collide with production declarations after running dev.
- CI builds before HTTP tests. `build:vercel` is a meaningful Next packaging alias. The obsolete copy into Vite `dist` was deleted. README and `docs/VERCEL.md` document custom-server startup, persistent Node storage, public assets and the Vercel Functions durability constraint.

### Parser evidence and remaining implementation

`artifacts/program/P02/final-cleanup/legacy-parser.log` records direct probes of the existing parser before deletion. Valid gzip JSON with a bad origin reaches origin validation and returns 403. Unsupported latin1 charset and unknown encoding return 415 before origin checks. Corrupt gzip returns 400. Decompressed JSON over 8 KiB returns 413. A truncated Content-Length JSON request receives a bare HTTP 400 and the next request still succeeds. These observations are Express baseline evidence only. The Next reader still needs equivalent bounded decompression, charset/encoding ordering and explicit abort coverage. Do not delete that baseline before matching these contracts.

Remaining work from the final-cleanup brief is explicit:

- Implement and verify those Next parser contracts, including decompression size bounds and aborted streams.
- Extend actual Next provider HTTP coverage to media timeout, incomplete or malformed SSE, provider media failures, invalid generated image dimensions, invalid cached media and recovery. Existing direct-service fault tests do not close those HTTP cases.
- Add deterministic bucket expiry and 10,000-bucket saturation cases, IPv6 /56 aggregation and multi-proxy-chain cases at the trusted socket boundary. Preserve no authority from unsigned or spoofed headers.
- Remove the now-uncalled `server/app.ts`, obsolete `server/index.ts`, Vite entry/configuration and `build:legacy` once parser parity passes. Remove Express, Helmet, Vite and associated types. The current adapter still uses express-rate-limit's maintained IPv6 helper; retain that dependency only with justification or replace it with a maintained normalization package and explicit tests. Do not replace it with an untested custom IPv6 parser.
- Update remaining source inventory, compilation commands and historical deployment material after deleting the legacy files. `legacy-inventory.log` records remaining references; these are not claimed absent.
- Root still owns independent reviews, the ten program lanes, performance comparison and P03/P04 restacks. Passing local tests does not mark P01 or P02 independently verified.

Model the Domain kept the isolated Next process lifecycle in one reusable test fixture. Prove It Works changed the regression and restart checks to exercise the actual Next artifact. The parser probe is the reason legacy deletion remains open.

### Final receipts for this continuation

All final commands exited zero, sequentially after the production build. Receipts reside under ignored `artifacts/program/P02/final-cleanup/`.

- `build-final.log` records `npm run build`.
- `typecheck-final.log`, `lint-final.log` and `unit-final.log` record strict typecheck, lint and all 19 unit tests.
- `regression-final.log` records all six actual Next browser suites, including guarded provider UI fixtures and microphone lifecycle.
- `security-final.log` records `verify-next-security.ts`, including actual Next provider faults, bounds, ownership, rate limits, durable ledger and restart checks already defined by that verifier.
- `restart-final.log` records the production `npm start` restart/download verifier.
- `packaging-final.log` records `npm run build:vercel` with the final Next packaging alias.
- `dev-final.log` records successful development startup and HTTP checks with an isolated database and no environment files present beyond `.env.example`. `dev.log` preserves the initial failed Turbopack probe.
- `screenshots/` contains the final actual Next shopper desktop and mobile captures. These do not claim media-fault screenshots or ten-lane program evidence.

No baseline evidence is relabelled as Next evidence. The parser probe and dependency inventory remain explicitly legacy evidence. Full P02 cleanup and independent verification remain open despite these passing checks.
