# Local production verification

Use Node 22, npm, system `zip`, and Playwright Chromium with its system libraries. Install with `npm ci` and `npx playwright install --with-deps chromium`. Packaging invokes the system zip executable. No provider key is required.

Run `npm run verify` from a checkout without `.env`, `.env.local`, `.env.production`, or `.env.production.local`. The runner refuses these files because Next loads them automatically. It passes a minimal environment, disables provider access, builds the app and MV3 extension, and runs strict typecheck, lint, unit tests and production build before browser tests. Existing npm baseline commands remain available.

The runner starts actual Next production on an ephemeral IPv4 loopback port with a new temporary SQLite database and adjacent media directory. It runs shopper, DOM and installed-extension regressions sequentially. The shopper driver covers signup, preference persistence after reload, control repair, review invalidation and exact simulated checkout confirmation. Axe output includes actual rule and node details. Screenshots, command logs and a JSON receipt appear under `artifacts/program/P03/<SHA>-<timestamp>/`. The receipt records the source SHA and dirty state. A dirty receipt is evidence of that working tree, not a clean commit verdict. Failed commands reject the run. The temporary database and processes are cleaned in `finally`.

P02 provider fixtures still use legacy Express and are excluded from this Next command pending P02 migration. Passing this command does not establish provider or security parity, manual screen-reader behavior, or toolbar activeTab activation. The installed-extension fixture grants access only to its loopback fixture origin and injects through the installed extension worker.

## SQLite migrations

`server/migrations/index.ts` owns the contiguous ordered migration registry. Version 1 retains the original account, session and order schema. Version 2 adds migration history without altering existing rows. Direct ledger callers retain lazy AI schema initialization. Migrations acquire an immediate transaction and reread the version under the writer lock. All pending SQL and version changes commit together or roll back together. Newer unsupported versions fail before schema or journal changes. Service initialization closes failed database handles.

Migration tests use synthetic temporary databases only. They cover installation, populated v1 preservation including password/session/preference/order and AI budget rows, reopen, concurrent connections, failed SQL rollback/retry and refusal of a future version. To add a migration, append a contiguous version with transactional SQL. Do not place transaction control or journal PRAGMAs inside migration SQL. Never edit a shipped migration. No production database copy is required or permitted by this procedure.
