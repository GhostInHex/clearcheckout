# P05 account recovery checkpoint

Status is partial implementation. Do not mark P05 complete or merge-ready.

Base is 323674f683457c1293c37f3ec92c461fbbf4c0be.
Branch is t3/account-recovery-controls.
Worktree is /data/home/.t3/worktrees/clearcheckout/t3-565d2253.
Physical schema dependency is t3/payment-domain, version 3. This unit reserves version 4. P03 remains the logical prerequisite. Root must restack after P02.

## Implemented

`server/auth.ts` owns purpose-bound random reset and verification tokens. SQLite stores SHA-256 hashes. Links expire after 30 minutes. Resends replace the previous token. Immediate transactions consume tokens with the password or verification update. Reset and password change revoke every session. Password change also invalidates outstanding account tokens. Signup and login now await a process-wide asynchronous scrypt queue with two active operations and sixteen waiting operations. No replacement session is issued during recovery or password change.

The typed mail adapter is injectable. `localInbox` supports deterministic synthetic tests. Production Next leaves mail disabled and exposes availability independently through `/api/account/mail`. No provider is configured and no real email was sent. Reset responses describe eligibility and possible delivery failure rather than asserting successful delivery. PUBLIC_ORIGIN supplies absolute links. Request Host never supplies link origin. Existing signup does not require verification.

App Router pages are `/account`, `/account/recover`, `/account/reset`, and `/account/verify`. Tokens arrive in URL fragments and are removed on submission. Links do not mutate state until an explicit POST. New account routes use the existing Next request-body, custom-header and origin boundary. Shared P02 security architecture was not rewritten. The Express adapter only awaits the newly asynchronous auth calls.

Export includes only account profile and owned orders. Credentials, session/token hashes and other accounts are excluded. Deletion requires the current password and exact DELETE MY ACCOUNT text. It removes the account, sessions, tokens and ordinary order rows transactionally. Payment attempt evidence, unresolved captures, provider identities, global ai_calls reservations and ai_safety remain. Retained payment bodies can include order snapshots and account identifiers. This is account closure with scoped removal, not erasure of all retained facts. Provider records and backups are outside this operation. Operator retention periods, access controls and eventual evidence disposal need deployment policy before production.

## Evidence

Receipts are under artifacts/program/P05. `unit.log`, `typecheck.log`, `lint.log`, `build.log`, `browser.json` and `browser.log` record local checks. `review/mail-unavailable.png` and `review/password-changed.png` came from actual production Next on an ephemeral loopback port with a temporary database and minimal environment. The focused browser checks keyboard submission, disabled-mail error, password change, revoked session and axe recovery-page audit. Unit tests exercise expiry, reuse, resend cooldown, purpose binding, hashing at rest, outage, verification, password change, export isolation, deletion confirmation and preservation of populated global spend/safety rows. They do not replace the outstanding browser lanes.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx tsx tests/auth-browser.ts`, and `npm run verify`. No credentials or production data are required. The browser script owns its temporary database and loopback server and removes them on exit.

## Remaining work

- Complete the full recovery browser matrix with injected inbox, expiry/resend/verification and deletion/payment-retention fixtures. Current production handler intentionally has no test-mail environment backdoor.
- Audit enumeration including timing. Mail delivery is awaited only for known accounts. Generic bodies alone do not establish timing resistance. Bound transport timeouts and avoid account-dependent response timing before enabling delivery.
- Add a bounded production mail adapter with server-only credentials, redaction and operator configuration. Disabled mail is an explicit deployment dependency. Do not request credentials for local implementation.
- Finish strict coverage and concurrency/race tests, particularly revoke versus in-flight login and async password checks. Verify token use under multiple connections.
- Improve account-control discovery, pending/error focus, verified status and explicit signed-out navigation. Audit every new page with axe and keyboard, then record a 30 to 60 second review video.
- Run the plan's baseline/head performance comparison and remaining real-browser lanes. No performance or complete accessibility claim is made.
- Independent OpenCode DeepSeek/GLM verification is root-owned and has not run. No children were started. No PR, push, merge, deploy, live model, payment SDK or real email was used.

## Continuation baseline

The continuation owner reviewed inherited dirty routes, migration 4, auth module, UI and tests before editing. These are inherited implementation, not new continuation work. Fresh `npm test` passed 37 tests. Fresh `npm run typecheck`, `npm run lint` and `npm run build` passed. Receipts are under `artifacts/program/P05/recovery-continuation/inherited-*`. Initial checkpoint commit preserves the partial implementation and its known timing and browser gaps. No independent review is claimed.

## Recovery continuation

Inherited checkpoint commit is `f28578155cc5f2b3ea3104e88c917fb90704fcd6`. It preserves all inherited work after fresh unit, typecheck, lint and build checks. The inherited auth browser also exited successfully.

The continuation changes public email requests to enqueue the same bounded job shape for known and unknown addresses. Account lookup, token creation and transport start on a later event-loop turn. Admission permits sixteen queued jobs and one running delivery. A one-second transport deadline aborts and permanently halts that auth instance on timeout. This bounds unresolved transports even if an adapter ignores cancellation. Delivery failures invalidate their token. This queue is volatile and makes no delivery guarantee. Disabled or halted mail remains explicitly unavailable. No provider or real mail was used. This removes the account-dependent awaited transport path; it does not claim measured statistical timing indistinguishability for every load pattern.

Migration 4 now includes an authentication generation. Session revocation increments it, and login rechecks generation and password after asynchronous verification before returning success. Tests cover revocation during in-flight login, bounded password queue overload, session expiry, concurrent token use on one and two SQLite connections, expiry, resend and purpose binding. Deletion preserves an actual populated payment attempt row, global AI calls and safety settings. The UI and export retention text now disclose retained order snapshots and account identifiers, provider records and backups.

The expanded browser driver uses an explicit generated preload in a temporary isolated process. The preload rejects non-test NODE_ENV. The Next adapter reads runtime environment through node:process rather than a compile-time-folded process.env.NODE_ENV expression. Only test mode can consume the preloaded adapter. No HTTP fixture endpoint, inbox retrieval endpoint, environment-only provider switch or production mail adapter was added. Synthetic tokens stay in temporary inbox files and URL fragments. The driver deletes its temporary database and inbox on exit.

Fresh continuation evidence is in `artifacts/program/P05/recovery-continuation`. `unit-retention.log` passes 40 tests. `lint-final.log` passes. `build-final.log` passes. `browser-final.log` exits successfully and `browser.json` records zero axe violations on all four account pages. The browser exercised keyboard recovery, reset success and reuse rejection, verification and resend cooldown, expired reset, export, missing-header CSRF rejection, password change with session revocation and account deletion. The first two browser attempts failed because the test adapter guard was compiled away; their logs remain as `browser-fixture-failure.log` and `browser-second.log`. The correction imports the runtime environment from node:process. No failed run counts as a pass.

`npm run verify` passed at the dirty continuation state based on checkpoint commit f285781. Its complete receipt is `artifacts/program/P03/f28578155cc5f2b3ea3104e88c917fb90704fcd6-1793858341062/receipt.json`. It covers typecheck, lint, unit, build and existing browser/DOM/extension regression commands. It is not an exact final-head or independent review receipt.

Remaining gaps keep P05 partial. The baseline/head performance protocol, review video, full ten-lane evidence, statistical enumeration analysis under load, account discovery/status and focus polish, production provider and retention policy, and root-owned independent TS/Next and OpenCode reviews remain outstanding. Production mail configuration remains a deployment prerequisite. Existing P02 boundary architecture remains untouched apart from P05 routing. No children, new worktrees, push, PR, merge, deployment, public port, production database, secrets, real mail, live AI or payment calls were used.

## P05 restack integration (2026-11-05)

Old P05 head was 9f13c02ca7ffa24592c92cfa9052dcd39789f256 on parent 323674f683457c1293c37f3ec92c461fbbf4c0be. Only its two own commits were rebased onto frozen P04 parent 0bd026416a284173ebbdd15c9e73785e5b1d9607. Replayed commits are 9d593c4 and 7647ea8. The final integration commit follows these commits and is reported in the handoff. No parent branch or other worktree was changed.

The deleted Express adapter remains deleted. Async signup/login and account operations use the actual Next handler, retaining the signed socket transport, per-client limiter and headers, bounded compressed JSON parser, raw WAV handling, origin checks and no-store. Migration 4 remains after payment schema 3. Latest-version and migration-count assertions derive from the registry. All account token, queue, race and retention code remains unchanged. Type System Discipline retained inferred types without casts or suppressions.

The auth browser driver now launches scripts/next-start.ts with an ephemeral loopback port. The generated inbox preload requires test mode, the exact temporary DB path and loopback hostname. Production mail remains disabled. The old tight readiness loop failed against custom startup; the bounded readiness retry now waits between attempts and retains server diagnostics. The focused account browser run passed after this correction, retaining all four page axe audits, keyboard recovery, fragment removal, expiry, reuse, cooldown, verification, export, password/session revocation and deletion assertions.

Fresh local evidence lives in artifacts/program/P05/restack. npm ci, Next build, whole strict typecheck and lint passed. The combined unit suite and clean-head npm run verify receipt are reported in the final handoff. No tests or meaningful assertions were removed. Independent reviews remain root-owned and blocked pending fresh reviewers. No independent verification, merge readiness, performance or video completion is claimed.
