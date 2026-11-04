# Implement the full ClearCheckout product

Build a supported checkout assistant for blind, low-vision, and keyboard or motor-access shoppers. Preserve the existing submission journey while adding verified merchant payments, broader assistance, and durable operation. Never let AI approve purchases or report an unverified payment as paid. Start with P01 for strict TypeScript and P02 for Next.js. Deliver P01 through P13 as the core product. All subsequent implementation uses TypeScript. P14 adds commercial billing. P15 adds the second app. P16 packages event-specific evidence.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. Check a box only when its evidence exists, such as a file, log, screenshot, test run, or SHA. The body is a how-to. The appendices record rationale and unproven assumptions.

The program runs `/data/home/.codex/skill-bundles/t3-pstack/2.2.0/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator lands every PR bottom-up. This document authorizes no execution, deployment, paid provider call, billing activation, or submission.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] Present this plan and wait for explicit execution instructions. Record the authorized release scope and whether P14 and P15 are included.
- [ ] Read the execution playbook, swarm skill, opening-a-pr playbook, how skill, interrogate skill, and project verification guide at program start and each audit tick.
- [ ] Run `cat /data/home/.codex/skill-bundles/t3-pstack/2.2.0/skills/poteto-mode/playbooks/autopilot-stack.md`. Resolve the other leaf paths from that plugin root. The template shorthand is `cat <plugin root>/skills/`.
- [ ] On execution authorization, create an hourly schedule_task tied to the execution thread. Do not schedule anything during planning.
- [ ] Use the following tick prompt verbatim.

> Re-read the execution playbook from disk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none.

- [ ] On hold, stop owner writes and cancel active delegates. Record exact heads and incomplete evidence.

### Spawn owners

- [ ] Assign one owner per active PR. Use isolated orchestrator-managed worktrees. Run P01, then P02, then P03. After P03, P04, P05, P06, and P08 can proceed independently. Follow each later dependency below.
- [ ] Write a throughput checkpoint before each dispatch. Name blocking inputs, independent work, shared files, and the smallest verifiable delivery. Use at most three coding owners plus one integration or review role. Verification lanes run in batches when capacity is lower than ten.
- [ ] Give one integrator ownership of package.json, the Next.js route adapters, shared contracts, schema migrations, and root deployment settings. Workers propose edits to those files through the integrator. Allocate migration IDs before concurrent work.
- [ ] Keep dependent PRs on their parent branches. Do not build on uncommitted work. Keep unrelated PRs on the verified baseline.
- [ ] Pause P09 until authentication and image-input feasibility are proven. Pause P11 checkout vision until crop privacy and an annotated evaluation are ready.
- [ ] Review-gate P02, P05, P07, P08, P09, P10, P11, P12, P13, P14, and P15 with screenshots and video. External deployments also need the operator's approval.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Use gh unless an installed Origin CLI resolves this repository. Record the chosen tool. Open ready PRs with the exact base branch, evidence links, and limitations.
- [ ] Run build, tests, lint, and strict TypeScript checks from P01 before push. Run deslop before commit and no-comments before review. Keep hooks enabled.
- [ ] Link each created or pushed PR through link_pull_request. Run independent interrogate review at the final head. Fix only verified blocking findings. Triage automated review comments with concrete evidence.
- [ ] Keep a decision trail in docs/verification/program-decisions.tsv with UTC time, PR, decision, evidence, and outcome. Record unavailable providers and incomplete checks honestly.

### Verdict and merge, for every PR

- [ ] Run the unit checks, ten live scenarios, a performance check, and independent correctness and privacy reviews at the exact code-ready SHA. Follow the swarm skill. Batch lanes if needed without dropping scenarios.
- [ ] After a small fix, rerun affected scenarios and one integrated verification. After changed behavior or a redesign, run the full relevant verification again. A could-not-run result leaves the gate open.
- [ ] Hand the verified stack to the operator. Do not merge automatically. Bind receipts to head and base SHAs. Use the shipping playbook patch-id rule only when the final rebase changes no patch content.

### Boot recipe, for every live lane

- [ ] Fetch the exact base and head SHAs into an isolated worktree. Use npm ci, npm run build, and an isolated DB_PATH. Start the server on a lane-specific port and wait for readiness.
- [ ] Drive the web app with the project control guide created in P03. Use the Playwright extension driver for MV3. Use HTTP scripts for backend faults and the official sandbox approval page for payment gestures. Use actual assistive technology for P12. Do not substitute API calls for UI evidence.
- [ ] Place screenshots, videos, logs, request redactions, axe JSON, and performance samples under artifacts/program/<PR>/<head-SHA>/lane-<n>/. Name every receipt in the report. Capture log-view screenshots for backend-only scenarios.
- [ ] Disable live models and payments by default. Use deterministic test transports for failure cases. Use approved sandbox credentials and a bounded provider budget only for the explicitly named live checks.

## Port the whole repository to strict TypeScript (P01)

**Depends on.** None.

**Files.**

- [ ] Edit or create `tsconfig.json`. Save the diff and verification receipts.
- [ ] Edit or create `tsconfig.server.json`. Save the diff and verification receipts.
- [ ] Edit or create `tsconfig.extension.json`. Save the diff and verification receipts.
- [ ] Edit or create `package.json`. Save the diff and verification receipts.
- [ ] Edit or create `package-lock.json`. Save the diff and verification receipts.
- [ ] Edit or create `src/**/*.tsx`. Save the diff and verification receipts.
- [ ] Edit or create `shared/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `server/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `extension/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `tests/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `scripts/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `vite.config.ts`. Save the diff and verification receipts.

**Build.**

- [ ] Capture baseline build and test receipts before changing sources. Port application, server, shared modules, extension, tests, scripts, and supported configuration to .ts or .tsx. Keep JSON, CSS, HTML, and tool-required JavaScript configuration where necessary. Keep Vite and Express during this migration so type errors and framework changes remain separate.
- [ ] Enable strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, and noEmit type checking with environment-specific Node and DOM libraries. Infer request and response types from Zod schemas. Model checkout events and extension messages as discriminated unions with exhaustive handling. Treat external data as unknown. Do not silence errors with blanket any, ts-nocheck, broad assertions, or disabled strictness.
- [ ] Add appropriate Node, React, Express, SQLite, and Chrome type definitions. Compile server TypeScript to runnable Node output and bundle extension TypeScript to MV3 JavaScript. Use a configured TypeScript test runner or compiled tests compatible with Node 22. Update start, build, browser-driver, packaging, and deployment commands. Do not leave duplicate legacy source files or change payment behavior.
- [ ] Add npm run typecheck and CI enforcement. After this PR, all new first-party application, backend, extension, test, and script code must be TypeScript. Record baseline limitations without claiming new feature completion.

**You see.**

- [ ] The same account, preference, repair, simulated-checkout, AI-consent, and extension journeys run from a strictly typed repository. Generated JavaScript remains a build artifact.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the existing browser, DOM, extension, mocked-model, media, and microphone suites. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p01-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Run signup, login, logout, and saved preferences. Pass only if existing API shapes and cookie behavior match baseline. Save `p01-lane-2.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 3. Run cart edits, review invalidation, cancellation, failure, and exact confirmation. Pass only if completed_demo remains the only successful payment outcome. Save `p01-lane-3.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 4. Compile shared domain code for both Node and Chromium. Pass only if browser bundles contain no Node-only dependencies. Save `p01-lane-4.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 5. Build and install the extension. Pass only if scan, repair, focus, cleanup, and reopen behavior match baseline. Save `p01-lane-5.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 6. Run npm run typecheck with all first-party source groups included. Pass only if no source group is silently excluded and the command succeeds. Save `p01-lane-6.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 7. Run mocked AI, media, budget, and microphone suites. Pass only if consent and retained spending reservations remain unchanged. Save `p01-lane-7.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 8. Start the compiled production server against a copy of a populated database. Pass only if existing data survives and account isolation holds. Save `p01-lane-8.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 9. Run packaging from a clean checkout. Pass only if deployable server, frontend, and extension artifacts are produced without secrets. Save `p01-lane-9.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 10. Search for leftover first-party JS and JSX sources and unsafe type suppressions. Pass only if every exception is tool-required and documented. Save `p01-lane-10.png` and the diagnostic log. Pass when the stated predicate holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** None. P01 is not review-gated. This means no interaction review gate. Independent correctness review and any deployment approval still apply.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Port the TypeScript application to Next.js (P02)

**Depends on.** P01.

**Files.**

- [ ] Edit or create `app/**/*.tsx`. Save the diff and verification receipts.
- [ ] Edit or create `app/api/**/route.ts`. Save the diff and verification receipts.
- [ ] Edit or create `lib/server/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `shared/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `next.config.ts`. Save the diff and verification receipts.
- [ ] Edit or create `package.json`. Save the diff and verification receipts.
- [ ] Edit or create `package-lock.json`. Save the diff and verification receipts.
- [ ] Edit or create `tests/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `scripts/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `extension/**/*.ts`. Save the diff and verification receipts.
- [ ] Edit or create `docs/VERCEL.md`. Save the diff and verification receipts.

**Build.**

- [ ] Validate the selected supported Next.js and React versions against current official documentation and the deployment target. Use the App Router with TypeScript. Move landing, auth, onboarding, dashboard, preferences, and demo views into routes. Preserve URLs or add explicit redirects. Keep browser DOM, microphone, and extension-interacting code behind client boundaries.
- [ ] Replace Express HTTP routes with typed Next.js Route Handlers. Extract reusable server services for accounts, SQLite, orders, model calls, and budgets. Preserve status codes, response schemas, cookie names and flags, origin checks, rate limits, request-size bounds, raw audio validation, security headers, and no-store behavior. Mark native SQLite handlers for the Node runtime. Preserve the webhook raw-body boundary for the later payment work.
- [ ] Keep database connections and provider credentials in server-only modules. Keep shared checkout and DOM logic independent of Next.js so the extension bundles separately. Preserve media responses, captions, videos, and download URLs. Replace Vite and Express build and server entry points after parity passes. Update every script and test that starts or imports the old app.
- [ ] Use a persistent Node deployment as the default for the Next.js app while SQLite is retained. Do not place native SQLite on ephemeral function storage. Prepare the hosting plan and environment documentation without deploying. P06 will deliver independent durable hosting. Remove obsolete Vite configuration, Express adapters, and proxy assumptions once all callers are migrated.

**You see.**

- [ ] The existing complete journey runs under a production Next.js build. The extension remains an independent TypeScript MV3 bundle. No browser bundle contains secrets or server-only dependencies.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the existing browser, DOM, extension, mocked-model, media, and microphone suites. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p02-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Run signup and login through Next.js Route Handlers. Pass only if sessions persist across navigation, reload, and logout with preserved security semantics. Save `p02-lane-2.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 3. Load every route directly and navigate between routes. Pass only if focus, headings, preferences, and protected-route behavior remain correct. Save `p02-lane-3.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 4. Run simulated checkout and revision invalidation through migrated APIs. Pass only if behavior and response contracts match the TypeScript Express baseline. Save `p02-lane-4.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 5. Run mocked explanation, audio, image, and SAM flows. Pass only if response types, content types, consent, limits, and budget accounting remain intact. Save `p02-lane-5.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 6. Run the production build and inspect browser bundles. Pass only if SQLite, Node crypto, environment secrets, and provider credentials are server-only. Save `p02-lane-6.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 7. Install the independently built extension and run repair with the Next.js demo. Pass only if extension behavior is unchanged. Save `p02-lane-7.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 8. Exercise foreign Origin, expired sessions, oversized JSON, and malformed audio. Pass only if the migrated boundaries reject them as before. Save `p02-lane-8.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 9. Restart the production app using a copied database and cached media. Pass only if persisted state and spending reservations survive. Save `p02-lane-9.png` and the diagnostic log. Pass when the stated predicate holds.
- [ ] Lane 10. Open video, captions, media, source archive, and extension downloads. Pass only if URLs, redirects, content types, and production start commands work without Express or Vite. Save `p02-lane-10.png` and the diagnostic log. Pass when the stated predicate holds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post screenshots and a video of route navigation, focus, account recovery from reload, and the complete demo journey. The operator reviews parity before merge.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Establish reproducible verification and migrations (P03)

**Depends on.** P02.

**Files.**

- [ ] Edit or create `package.json`. Retain a diff and checks at the PR head.
- [ ] Edit or create `scripts/verify.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/extension-browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/migrations/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/VERIFY.md`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Add one verification command that boots an isolated temporary database, builds the app and extension, and collects test and accessibility receipts. Replace unconditional schema-version assignment with ordered transactional migrations. Retain the strict TypeScript and lint gates from P01. Run the harness against the production Next.ts app from P02.

**You see.**

- [ ] A clean checkout runs the existing journey, and upgrading a populated v1 database preserves users, preferences, orders, and AI reservations.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P03. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p03-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise migration interruption and rerun through the real driver. Save `p03-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise populated v1 upgrade through the real driver. Save `p03-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise fresh install through the real driver. Save `p03-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise isolated test databases through the real driver. Save `p03-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise existing account journey through the real driver. Save `p03-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise extension packaging through the real driver. Save `p03-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise axe rule and node receipts through the real driver. Save `p03-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise no secrets in artifacts through the real driver. Save `p03-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise downgrade refusal through the real driver. Save `p03-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** None. P03 is not review-gated. This means no interaction review gate. Independent correctness review and any deployment approval still apply.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Model real payment attempts separately from demo orders (P04)

**Depends on.** P03.

**Files.**

- [ ] Edit or create `shared/checkout.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/orders.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/migrations/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/api/**/route.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/payment.test.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Keep completed_demo as a distinct outcome. Add PaymentAttempt with immutable order revision, integer minor-unit amount, currency, merchant, provider ID, idempotency key, and status. Model review, awaiting gesture, approving, capturing, paid, failed, cancelled, and unknown outcomes. Confirmation binds to the reviewed snapshot. A changed order invalidates approval. Unknown capture outcomes reconcile before retry.

**You see.**

- [ ] Only verified server evidence can produce paid. A stale review, alternate phrase, voice transcript, or client-supplied outcome cannot do so.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P04. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p04-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise stale revision through the real driver. Save `p04-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise wrong exact phrase through the real driver. Save `p04-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise changed delivery through the real driver. Save `p04-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise duplicate confirmation through the real driver. Save `p04-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise concurrent attempts through the real driver. Save `p04-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise cancellation before capture through the real driver. Save `p04-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise timeout becomes unknown through the real driver. Save `p04-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise forged client outcome through the real driver. Save `p04-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise completed demo stays distinct through the real driver. Save `p04-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** None. P04 is not review-gated. This means no interaction review gate. Independent correctness review and any deployment approval still apply.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Complete account recovery and account controls (P05)

**Depends on.** P03.

**Files.**

- [ ] Edit or create `server/auth.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/api/**/route.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/migrations/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/**/*.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/auth.test.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Extract account routes only as needed. Add expiring single-use hashed verification and reset tokens, password change, session revocation, and account export and deletion with explicit confirmation. Use a configured mail adapter and local test inbox. Bound password hashing concurrency. Define retention and provider-data disclosures. Keep local assistance usable when mail or AI is down.

**You see.**

- [ ] A shopper can recover an account and revoke sessions without exposing account ownership through reset responses.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P05. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p05-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise expired reset through the real driver. Save `p05-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise reused token through the real driver. Save `p05-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise verification resend limit through the real driver. Save `p05-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise old session revoked through the real driver. Save `p05-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise mail outage through the real driver. Save `p05-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise account enumeration response through the real driver. Save `p05-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise export isolation through the real driver. Save `p05-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise deletion confirmation and retention through the real driver. Save `p05-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise keyboard recovery journey through the real driver. Save `p05-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P05/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Move the backend onto durable independent hosting (P06)

**Depends on.** P03.

**Files.**

- [ ] Edit or create `next.config.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/ai-ledger.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `deploy/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `scripts/backup.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/OPERATIONS.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `vercel.json`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Package the Next.ts Node application for a persistent host with a mounted SQLite volume and one database-writing service. Configure TLS, exact origins, secure cookies, readiness, encrypted backups, restore drills, log redaction, and alerting. Preserve AI reservations on restore. Keep staging provider budgets separate. Prepare rollback and migration compatibility before switching production traffic.

**You see.**

- [ ] A staging signup and saved preference survive a service restart and a backup restore on a fresh instance without this sandbox or an Express proxy.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P06. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p06-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise service restart through the real driver. Save `p06-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise persistent order history through the real driver. Save `p06-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise backup restore through the real driver. Save `p06-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise ledger preservation through the real driver. Save `p06-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise origin rejection through the real driver. Save `p06-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise secure cookie session through the real driver. Save `p06-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise log redaction through the real driver. Save `p06-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise provider outage through the real driver. Save `p06-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise rollback rehearsal through the real driver. Save `p06-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** None. P06 is not review-gated. This means no interaction review gate. Independent correctness review and any deployment approval still apply.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Verify PayPal sandbox approval and capture (P07)

**Depends on.** P04, P06.

**Files.**

- [ ] Edit or create `server/paypal.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/orders.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/api/**/route.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/**/*.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/paypal.test.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/paypal-browser.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Validate current official Orders API and sandbox setup first. Add server-created orders, user-gesture approval, server capture, verified signed webhooks, deduplication, and reconciliation. Check completed capture status, payee, amount, currency, and provider order binding. Persist request keys before calls. Refuse duplicate capture after uncertain transport. Never automate PayPal approval or accept paid from browser messages.

**You see.**

- [ ] The controlled merchant demo ends with a verified sandbox receipt. Failed, cancelled, and unknown outcomes remain distinct. No live money is enabled.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P07. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p07-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise actual sandbox approval through the real driver. Save `p07-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise user cancellation through the real driver. Save `p07-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise declined capture through the real driver. Save `p07-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise wrong amount through the real driver. Save `p07-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise wrong currency or payee through the real driver. Save `p07-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise duplicate capture through the real driver. Save `p07-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise timeout and reconciliation through the real driver. Save `p07-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise duplicate or forged webhook through the real driver. Save `p07-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise revision change during approval through the real driver. Save `p07-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P07/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Expand local repairs and measure accessibility changes (P08)

**Depends on.** P03.

**Files.**

- [ ] Edit or create `shared/dom.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `extension/content.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/dom-browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/axe-before-after.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `stores/store-b/`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Add a Control registry with stable local IDs, provenance, DOM fingerprint, supported capabilities, and sensitivity. Expand semantic discovery with fixtures for accessible names, open shadow roots, visibility, and custom controls. Add Store B with hover-only and drag-only interactions. Repair only demonstrated semantics. Generate before/after axe counts by rule and node. Preserve existing merchant labels and focus.

**You see.**

- [ ] Two controlled stores have measured repairs that remain correct after rerenders. Unsupported frames and ambiguous controls are identified explicitly.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P08. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p08-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise icon-only remove through the real driver. Save `p08-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise label precedence through the real driver. Save `p08-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise hidden controls through the real driver. Save `p08-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise open shadow root through the real driver. Save `p08-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise cross-origin frame boundary through the real driver. Save `p08-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise rerender replacement through the real driver. Save `p08-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise merchant override through the real driver. Save `p08-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise Store B keyboard alternative through the real driver. Save `p08-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise before and after rule counts through the real driver. Save `p08-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P08/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Connect the extension to consent-based AI control labeling (P09)

**Depends on.** P05, P06, P08.

**Files.**

- [ ] Edit or create `extension/background.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `extension/content.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `shared/labels.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/labels.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/ai-ledger.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/labels.test.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Spike supported Muse Spark image input and extension authentication first. Exchange a short-lived single-use linking code through the account site for a scoped revocable extension credential. Keep API secrets on the server. Build crop-only non-input requests with explicit preview and consent. Exclude sensitive descendants, overlapping sensitive regions, and unsafe nearby text. Validate image dimensions, types, bounds, allowed context, and request budgets server-side. The server cannot prove arbitrary pixels contain no sensitive content. Restrict requests to the reviewed extension capture path and controlled fixtures until a privacy review demonstrates the capture boundary. Cache by model, prompt, origin, control fingerprint, and context. Treat page text as untrusted data. Apply only labels that pass an evaluated policy and shopper review. Keep unknown when evidence is insufficient.

**You see.**

- [ ] A shopper can review an AI suggestion for an unnamed control. Sensitive fields never reach the provider, and local repair still works offline.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P09. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p09-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise extension linking and revocation through the real driver. Save `p09-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise input crop rejection through the real driver. Save `p09-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise sensitive overlapping field through the real driver. Save `p09-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise prompt injection text through the real driver. Save `p09-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise uncertain label stays unknown through the real driver. Save `p09-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise provider unavailable through the real driver. Save `p09-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise cache invalidation through the real driver. Save `p09-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise shared budget exhausted through the real driver. Save `p09-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise no upload before consent through the real driver. Save `p09-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P09/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Build guided workflows and reversible local assistance (P10)

**Depends on.** P04, P08, P09.

**Files.**

- [ ] Edit or create `shared/commands.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `shared/merchants.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `extension/content.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/**/*.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/commands.test.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Add MerchantAdapter capability detection and a Command union for navigation, read total, remove item, undo local repair, and unknown suggestions. Scope destructive commands to supported adapters and require review. Keep payment confirmation exact and outside fuzzy matching. Add a linear guided step list, one live announcement channel, optional app speech, per-origin preferences, local-only remembered labels with expiry, and user-visible reset. Invalidate remembered labels when fingerprints change.

**You see.**

- [ ] The shopper can navigate both supported stores and undo assistance. Unknown merchants receive scanning and navigation only where supported.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P10. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p10-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise keyboard full journey through the real driver. Save `p10-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise remove selected item through the real driver. Save `p10-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise wrong item rejected through the real driver. Save `p10-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise undo owned label through the real driver. Save `p10-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise preserve merchant mutation through the real driver. Save `p10-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise fuzzy navigation through the real driver. Save `p10-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise exact payment boundary through the real driver. Save `p10-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise remembered label invalidation through the real driver. Save `p10-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise screen-reader speech does not double through the real driver. Save `p10-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P10/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Extend voice navigation and evaluate checkout vision (P11)

**Depends on.** P09, P10.

**Files.**

- [ ] Edit or create `src/VoiceNavigation.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `src/VisualExplorer.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/media-ai.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `extension/background.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/media-browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `spikes/checkout-vision/`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Extend reviewed transcription to the supported command union without granting payment authority. Test real microphone permissions, stop, expiry, and device loss. Spike SAM on consented control crops with annotated fixtures. Match candidate boxes to Control IDs, never invent payment semantics from segmentation. Retain current illustrative product scene. Promote checkout detection only if it improves held-out control discovery without accepting sensitive crops or false actions. Otherwise record the failed hypothesis and keep a documented experimental feature.

**You see.**

- [ ] Voice remains reviewable and cannot confirm money movement. Checkout vision has a measured go or no-go result separate from product-image magnification.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P11. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p11-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise physical microphone stop through the real driver. Save `p11-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise device permission denied through the real driver. Save `p11-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise unrecognized transcript through the real driver. Save `p11-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise payment speech rejected through the real driver. Save `p11-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise screen-reader coexistence through the real driver. Save `p11-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise image-only fixture through the real driver. Save `p11-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise canvas fixture through the real driver. Save `p11-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise wrong SAM box through the real driver. Save `p11-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise provider timeout and retained reservation through the real driver. Save `p11-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P11/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Validate supported merchants and accessibility with users (P12)

**Depends on.** P07, P10, P11.

**Files.**

- [ ] Edit or create `tests/merchant-browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `shared/merchants.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/COMPATIBILITY.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/USER-TESTING.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/verification/`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Run one public-store read-only repair trial without placing orders. Build a published capability matrix for Store A, Store B, and that merchant. Recruit consenting blind, low-vision, and keyboard or motor-access users. Run NVDA with Chrome and VoiceOver with Safari for the web app. Run Chromium extension checks separately. Record task completion, wrong labels, blocked steps, and consented feedback. Treat small-sample results as usability evidence, not population estimates. Fix critical blockers in focused follow-up PRs before release.

**You see.**

- [ ] The published compatibility statement matches recorded behavior, and real assistive-technology users can evaluate the supported journey.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P12. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p12-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise NVDA web journey through the real driver. Save `p12-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise VoiceOver web journey through the real driver. Save `p12-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise NVDA Chromium extension through the real driver. Save `p12-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise low-vision zoom through the real driver. Save `p12-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise keyboard-only checkout through the real driver. Save `p12-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise reduced motion through the real driver. Save `p12-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise public-store read-only scan through the real driver. Save `p12-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise user task observation through the real driver. Save `p12-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise no mouse fallback for claimed flows through the real driver. Save `p12-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P12/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Package the supported product for release (P13)

**Depends on.** P05, P06, P07, P12.

**Files.**

- [ ] Edit or create `extension/manifest.json`. Retain a diff and checks at the PR head.
- [ ] Edit or create `scripts/build-extension.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `public/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/RELEASE.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/PRIVACY.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/SUPPORT.md`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Add signed release versioning, reproducible archives, CI verification, permissions rationale, privacy and retention documentation, support routes, and Chrome Web Store listing materials. Explain sandbox payments and supported merchants. Remove stale README deferrals for features actually verified. Record independent security review and resolve material findings. Prepare a staged rollout and rollback. Production payment activation remains a separate reviewed merchant decision.

**You see.**

- [ ] A new shopper can install the release, understand its limits, recover access, and complete the supported journey using published instructions.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P13. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p13-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise clean-machine install through the real driver. Save `p13-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise upgrade preserves preferences through the real driver. Save `p13-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise extension revocation through the real driver. Save `p13-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise keyboard onboarding through the real driver. Save `p13-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise documentation matches UI through the real driver. Save `p13-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise archive excludes secrets through the real driver. Save `p13-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise support path through the real driver. Save `p13-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise release rollback through the real driver. Save `p13-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise full sandbox receipt journey through the real driver. Save `p13-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P13/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Add subscription billing only after the core release (P14)

**Depends on.** P05, P06, P13.

**Files.**

- [ ] Edit or create `server/billing.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/entitlements.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/migrations/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `app/**/*.tsx`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/billing.test.ts`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Confirm pricing and included usage with the operator before connecting a billing provider. Default the initial product to free with bounded AI usage. Add hosted subscription checkout, verified webhooks, idempotent entitlement changes, customer portal, cancellation, and accessible usage disclosure. Keep subscription billing entirely separate from shopper merchant payments. Preserve local accessibility assistance when an AI allowance ends.

**You see.**

- [ ] A subscriber sees accurate plan and usage state. Cancellation stops renewal without blocking local assistance.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P14. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p14-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise subscription starts through the real driver. Save `p14-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise duplicate event through the real driver. Save `p14-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise out-of-order event through the real driver. Save `p14-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise cancellation through the real driver. Save `p14-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise failed renewal through the real driver. Save `p14-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise portal return through the real driver. Save `p14-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise entitlement isolation through the real driver. Save `p14-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise AI quota exhausted through the real driver. Save `p14-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise free local repair still works through the real driver. Save `p14-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P14/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Extract the reusable core and build the second app (P15)

**Depends on.** P13.

**Files.**

- [ ] Edit or create `shared/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `apps/forms/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `server/forms.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `tests/forms-browser.ts`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/CORE.md`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Extract only code with real callers in checkout and the new app. Build a controlled accessible form assistant with local field descriptions, guided navigation, review, and explicit submission. Do not store or upload field values by default. Keep form submission separate from payment confirmation. Reuse accounts, consent, preferences, budget accounting, and repair logic where semantics match.

**You see.**

- [ ] Two distinct apps use the same tested accessibility core. The form app supports a full keyboard journey without silently submitting personal data.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P15. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p15-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise checkout regression through the real driver. Save `p15-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise form keyboard journey through the real driver. Save `p15-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise unknown field through the real driver. Save `p15-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise required-field error through the real driver. Save `p15-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise cancel before submit through the real driver. Save `p15-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise explicit submit review through the real driver. Save `p15-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise sensitive field stays local through the real driver. Save `p15-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise shared preference persistence through the real driver. Save `p15-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise unsupported form boundary through the real driver. Save `p15-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** The operator reviews before merge.

- [ ] Post lane screenshots and a 30 to 60 second video under `artifacts/program/P15/review/` in chat. Include keyboard focus, errors, and the successful end state. Stop at merge-ready until the operator reviews the interaction.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.


## Prepare event-specific evidence and handoffs (P16)

**Depends on.** P13; P14 only if billing is claimed; P15 only for a two-app submission.

**Files.**

- [ ] Edit or create `docs/SUBMISSION-FORM.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/SUBMISSION-HANDOFF.md`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/submissions/`. Retain a diff and checks at the PR head.
- [ ] Edit or create `docs/submission-video.md`. Retain a diff and checks at the PR head.

**Build.**

- [ ] Check official current event eligibility, deadlines, reuse rules, and required tools before preparing each submission. Treat the old Meta, PayPal, Geek Room, and Kiroween calendar as historical planning input. Map claims to receipts and disclose reused assets and simulated behavior. Produce accessible videos and captions for each actual supported entry. Record confirmation receipts after the operator submits.

**You see.**

- [ ] Each submitted claim points to reproducible evidence and a working artifact. A submitted status requires an actual receipt.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Add behavioral cases for the named failure paths in the PR test files. Run `npm test`, `npm run build`, and the focused P03 verification command for P16. Save output with the head SHA. Existing browser commands remain regression checks, not proof of new behavior.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claudeAgent/claude-opus-5-5` at the PR head, subject to the configured swarm-worker override. Use the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the existing signup, preference save, repair, review, and simulated checkout at trunk and head. Record absent new features on trunk. Also gate the new end state under You see. Save `p16-regression.png`. Pass when existing behavior survives and the added state meets its stated predicate.
- [ ] Lane 2. Exercise public demo journey through the real driver. Save `p16-lane-2.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 3. Exercise video and captions through the real driver. Save `p16-lane-3.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 4. Exercise source archive through the real driver. Save `p16-lane-4.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 5. Exercise extension archive through the real driver. Save `p16-lane-5.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 6. Exercise clean README setup through the real driver. Save `p16-lane-6.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 7. Exercise sandbox payment evidence through the real driver. Save `p16-lane-7.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 8. Exercise model evidence through the real driver. Save `p16-lane-8.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 9. Exercise consented tester evidence through the real driver. Save `p16-lane-9.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.
- [ ] Lane 10. Exercise submitted receipt verification through the real driver. Save `p16-lane-10.png` and the matching diagnostic log. Pass when the Build and You see requirements hold for this scenario without an unauthorized action, misleading success, or lost state.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the existing local signup-to-dashboard and scan-to-repaired-state p95 elapsed time at both trunk and head. Also measure the new feature from user action to its first useful state, with external wait recorded separately.
- [ ] Probe. Use an instrumented Playwright driver with 5 warmups and 20 measured runs per SHA. Alternate trunk and head runs with the same fixture and machine. Use mocked provider responses for repeatability. Record real sandbox and model wait separately without extrapolating ratios.
- [ ] Baseline. Record trunk samples first. If the new feature is absent, record absence and use the common existing journey for the relative comparison.
- [ ] Rule. Fail if a common-journey p95 regresses by more than both 20 percent and 100 ms. Proposed absolute budgets are 250 ms for local command or repair, 2 seconds for local API response and visible feedback, and a visible pending state within 500 ms for external work. Keep provider timeouts bounded. These are acceptance targets, not measured claims. Separate human approval time from application latency.

**Review gate.** None. P16 is not review-gated. This means no interaction review gate. Independent correctness review and any deployment approval still apply.

**Merge.**

- [ ] Obtain a clean independent verdict at the exact head SHA, finish automated-comment triage, and attach unit, live, and perf receipts. Recheck after a changed patch. Hand off to the operator for bottom-up merge.

## Close the program

- [ ] Check every included work box against an actual receipt. Record deferred optional PRs as excluded from this release, not completed.
- [ ] Run the full installed-extension and hosted-web journeys after integration. Verify backup restore, account recovery, exact payment confirmation, and provider-budget preservation.
- [ ] Publish a capability matrix, known limitations, supported versions, deployment ownership, rollback procedure, and the remaining backlog. Keep production payments off until separately authorized.
- [ ] Cancel the audit schedule, stop temporary resources, and deliver the final report with PR links, exact release SHA, evidence, and unresolved risks.

## Appendix A. Prototype evidence

The planning baseline is a74db2f18b4a01a8be496fb5ef4e535b975ce103. No prototype or new live integration was run during planning. File pointers after P02 describe intended TypeScript locations rather than files already migrated. Existing verification records describe the submission build, not the proposed features. No branch, screenshot, or result is invented here.

P01 must verify server compilation, test execution, and extension bundling under strict TypeScript. P02 must prove App Router parity, native SQLite runtime support, request-bound preservation, and production artifact parity. Neither migration has run during this plan revision.

The implementation owner must resolve these empirical questions before the corresponding feature is built. P03 must prove populated-v1 migration and rollback behavior. P06 must prove persistence on the chosen host. P07 must create and capture a real sandbox order. P09 must prove scoped extension authentication and supported image input using nonsensitive fixtures. P11 must compare checkout control detection with DOM-only discovery on a held-out annotated set. Save each spike branch, SHA, method, results, and screenshots. A failed spike changes the implementation approach, not the reported evidence.

For P09, require zero sensitive uploads and zero accepted wrong labels on the held-out test set before automatic application is considered. Default to reviewed suggestions. A model confidence number alone is not a calibrated correctness probability. For P11, compare recall at the same zero-false-action constraint. Promote only an observed improvement. These finite-set checks do not establish universal safety.

## Appendix B. Alternatives rejected

The operator requires TypeScript first and Next.ts second. P01 changes source language while preserving Vite and Express behavior. P02 then changes the framework while preserving the typed domain and external API contracts. Keep SQLite and shared extension modules. Avoid an unrelated monorepo rewrite.

A distributed backend would complicate the shared budget ledger. Start with one durable SQLite writer and tested backups. Revisit the database only after measured concurrency or availability requirements exceed that deployment.

Universal merchant payment automation is excluded. A merchant creates its own provider orders. On external stores the assistant can guide the shopper to supported merchant controls, but cannot claim server-verified capture unless that merchant integrates with it. Fuzzy commands and AI never replace exact payment confirmation.

Subscription billing and the second app are included as separate later milestones. They do not block the core checkout release. Screenshot blur is not a reason to upload payment fields. Prefer rejecting sensitive crops over attempting to redact them. Open-weights free-form command matching remains optional until deterministic commands fail a recorded usability need.

## Appendix C. Risks

P05 needs a mail provider and retention decisions. P06 needs a hosting account, storage, backup destination, and approved cutover. P07 needs merchant sandbox credentials and separate buyer credentials. P09 needs validated image-model support and a scoped extension auth design. Request secrets through the secret tool when execution needs them. Never put credentials in this document or chat.

The original tests/browser.js uses clicks and does not prove a keyboard-only journey. The original extension test injects with extra localhost test permission and does not prove toolbar activation. P03 records these as missing baseline evidence. P10 and P12 must close the keyboard-only gap with real interaction receipts.

P08 through P12 cannot promise closed-shadow-root or cross-origin-frame access. P11 may produce a no-go for checkout segmentation. P12 needs participant availability and access to real NVDA and VoiceOver environments. Browser automation and axe checks cannot substitute for those sessions. Record unavailable environments as blockers to the corresponding claim.

P14 requires an operator decision on pricing, billing provider, and customer terms. The default remains free and capped. P15 requires choosing the first supported form workflow. The default is a controlled form demo. Customer outreach, deployment, account deletion in production, billing activation, and real-money payment activation require their own authorized scope.

No duration is promised. Provider access, merchant review, participant recruitment, and store approval have external lead times. Estimate each PR after its feasibility check. Implement one verified delivery at a time while parallelizing independent code ownership.

## Appendix D. Links and reading list

- Read [the original roadmap](/data/workspace/hackathons/clearcheckout-full-plan.md), [the five-hour scope](/data/workspace/hackathons/clearcheckout-5h-plan.md), and [the implemented scope](../../SUBMISSION.md).
- Read [the verification record](../VERIFICATION.md), [the deployment constraints](../VERCEL.md), and [the multimodal boundaries](../MULTIMODAL.md).
- At baseline, inspect the existing .js and .jsx equivalents before migration. After P02, inspect `shared/checkout.ts`, `shared/dom.ts`, `app/api/**/route.ts`, `server/ai-ledger.ts`, `server/meta-ai.ts`, `server/media-ai.ts`, `extension/background.ts`, `extension/content.ts`, and `app/**/*.tsx` before changing their behavior.
- Baseline commands are `npm test`, `npm run build`, `npm run test:browser`, `npm run test:dom`, `npm run test:extension`, `npm run test:meta-browser`, `npm run test:media-browser`, and `npm run test:microphone`. Live scripts consume provider credits and are not default CI checks.
- Read `/data/home/.codex/skill-bundles/t3-pstack/2.2.0/skills/how/SKILL.md` for every cross-module PR. Read `/data/home/.codex/skill-bundles/t3-pstack/2.2.0/skills/interrogate/SKILL.md` before feature review. Keep the decision trail per `/data/home/.codex/skill-bundles/t3-pstack/2.2.0/skills/show-me-your-work/SKILL.md`. Use the project driver from P03 for live verification.
- At implementation time, verify current official PayPal Orders, webhook-signature, Meta model-input, Chrome extension messaging and storage, selected hosting, and billing-provider documentation. This plan specifies desired behavior, not unverified current API signatures or prices.

Principle choices in this plan are Sequence Work into Verifiable Units for dependency-bound PRs, Prove It Works for real artifact receipts, Laziness Protocol for preserving domain logic while replacing the requested language and framework, and Encode Lessons in Structure for the plan checker and repeatable P03 verification command.
