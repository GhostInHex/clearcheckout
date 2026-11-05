# P09 linking foundation checkpoint

P09 is incomplete. The prepared worktree began clean at 4af125338ea58af720a73bbdb90c6e183287b64b. Only this checkout was changed. No child, push, PR, merge, deploy, secret, environment file, live provider or production database was used.

## Documented feasibility

Official Meta documentation inspected on 2026-11-05 at https://dev.meta.ai/docs/image-understanding describes POST https://api.meta.ai/v1/responses with model muse-spark-1.3 and a user message containing input_text and input_image blocks. input_image.image_url is a string containing a public URL or base64 data URL. The documentation also describes uploaded file IDs. This is documentation evidence only. No model request, credential availability, account access, output quality, crop privacy or provider retention was verified. No crop-specific API contract is assumed.

## Implemented foundation

Shared Zod schemas own the approval binding and exchange shape. Migration 6 follows versions 1 through 5 without gaps. The account-authenticated approval endpoint grants a two-minute single-use code bound to shopper, approved extension ID, installation ID and nonce. Only hashes of codes and credentials are stored. Immediate transactions consume codes and create seven-day labels:suggest credentials together. Device inspection omits hashes and credentials. Revocation is ownership scoped and repeatable. Missing users invalidate access. Account deletion removes linking and device records without changing the retained AI spend ledger.

The server defaults to disabled linking. CC_APPROVED_EXTENSION_ID must be exactly one Chromium extension ID. Only that chrome-extension origin receives CORS on /api/extension/exchange. It receives no cookie credential permission. Exchange does not rely on the website session cookie. Account issuance, device inspection and revocation retain the existing session and mutation-origin boundary. The credential has no HTTP label route or payment authority in this checkpoint.

A supplied installation ID and nonce are binding data, not proof of possession of an actual installed extension. That proof requires the remaining background-owned handshake. Do not enable this incomplete foundation for real shoppers.

## Remaining work

The extension still performs local repairs only. Account device UI and background-owned installation identity, nonce, credential storage and exact sender/message checks remain unimplemented. The runnable foundation is the authenticated HTTP issuance/exchange/inspection/revocation path, not a completed shopper linking journey.

Controlled fixture crop capture, local preview, explicit upload consent, sensitive descendant and overlap rejection, byte/dimension/context validation, provider adapter, durable shared reservation/cooldown/cache integration, reviewed suggestion UI, DOM replacement invalidation and rollback remain unimplemented. No screenshot upload route exists. No claim of universal screenshot safety or live inference is made.

Actual installed-extension linking/consent/review browser testing, privacy payload assertions, malformed-model and prompt-injection cases, held-out evaluation, timeout/cap/offline coverage of labeling, review video and performance comparison could not run because those paths do not exist. Zero sensitive uploads and zero accepted wrong labels are required finite-set gates for the later implementation, not results of this checkpoint. Independent DeepSeek/GLM review remains root-owned and outstanding.

## Verification method

npm ci installed locked dependencies. npm run verify generates Next types, checks strict source coverage and lint, builds extension and Next, runs all unit tests and existing actual Next/browser regressions, security and restart checks. Receipts are under artifacts/program/P09 and the inherited artifacts/program/P03 runner directory. The initial direct typecheck failed before dependency installation and does not count as a pass.

The new direct-service tests cover hash-at-rest, code reuse, exact expiry, nonce/installation/origin mismatch, ownership, repeated revocation, expired credentials and deleted shoppers. The actual Next HTTP case covers account-session enforcement, cross-origin exchange without cookies, exact CORS without credential permission, reuse, device inspection/revocation and refusal of a label upload path. These tests do not prove the extension handshake.

Model the Domain selected separate approval and device records. Boundary Discipline and Type System Discipline selected strict schema parsing before database operations. Make Operations Idempotent selected atomic single-use exchange and repeatable revocation. Prove It Works selected actual Next HTTP checks in addition to service tests. Architectural alternatives considered in-thread were a cross-origin website cookie and a scoped credential exchange. The latter preserves the SameSite cookie boundary. All skill-requested delegation was skipped under the explicit no-children instruction.

The first full verifier receipt at artifacts/program/P03/4af125338ea58af720a73bbdb90c6e183287b64b-1793863851013 failed two new tests because approval insertion supplied seven placeholders for six columns. The corrected insert passed both service cases and the actual Next case in the subsequent 60-test suite. The failure remains retained. The subsequent working-source receipt uses artifacts/program/P03/4af125338ea58af720a73bbdb90c6e183287b64b-1793864019645 and explicitly records dirty source against the confirmed base. Final command outcomes and the resulting committed SHA belong to the handoff receipt, avoiding a self-referential SHA in this file.

Throughput checkpoint scope was deliberately reduced to the durable HTTP linking foundation. The remaining user-facing extension handshake and image/privacy path are required work, not polish. This is not a completed runnable shopper auth-link milestone and does not close P09. No independent review or merge-ready claim follows from local tests.

Final working-source npm run verify passed all commands, including 60 tests, six browser suites, provider/security checks and production restart/download checks. The receipt is artifacts/program/P03/4af125338ea58af720a73bbdb90c6e183287b64b-1793864019645/receipt.json. Separate npm run test:controls and npm run test:paypal-mocked passed after the build. Their logs are artifacts/program/P09/two-store.log and paypal-mocked.log. No source behavior changed after these checks. Documentation and commit metadata changes are not an exact-head full-verifier rerun.
