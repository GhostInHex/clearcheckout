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
