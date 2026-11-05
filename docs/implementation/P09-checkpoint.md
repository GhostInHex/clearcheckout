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


## Installed handshake continuation

The worker now owns installation identity and nonce creation, exact fixed development-origin exchange, bounded fetch timeout, and restricted session credential storage. Only its exact options page may send binding/exchange/forget messages. A tab sender must identify that exact options URL. Content scripts and merchant pages receive no credential. Both storage areas restrict access to trusted contexts. Browser shutdown loses the session credential. Forgetting removes local access; account revocation remains separately available.

The installable archive includes an options page with explicit optional permission for http://localhost:4319 only. No production origin is enabled. The account page approves pasted installation bindings, displays the short-lived code and owned devices, expiry, scope and revocation. Local panel behavior is retained. The actual installed Chromium test uses a copied manifest pregranting only this development origin because headless automation cannot approve the optional permission prompt. That prompt itself remains a manual gate.

Commands for this continuation are npm run build, npm run typecheck, npm run lint, and node --import tsx tests/extension-link-browser.ts. The installed test exercises the real Next backend, signup cookie, account approval UI, worker exchange, device inspection, revocation and local forgetting. It uses no browser route fulfillment. Its receipt and screenshot are artifacts/program/P09/extension-ui/installed.json and link.png. The first attempts failed on a user-gesture permission call and an overly strict options-tab sender guard; those failures were corrected before the passing run.

P09 remains incomplete. No crop preview, consent upload, server crop validator, provider suggestion adapter, shared label budget/cache, reviewed-label application, privacy evaluation or held-out model evaluation was implemented. This is unfinished work, not a proven model or privacy infeasibility. Image suggestions are visibly unavailable and there is no capture or upload capability. Focused consent/suggestion/axe/privacy tests, mock provider matrix, review video and performance measurements remain open. Independent review remains root-owned. Do not enable this development linking build for real shoppers.


## Crop recovery probe, 2026-11-05

The recovery unit adds an exact synthetic fixture at `/fixtures/label-crop.html`, a worker-owned fixed 64 by 64 crop path using captureVisibleTab and OffscreenCanvas, and local preview UI. No upload, consent-to-upload, label HTTP route, provider adapter, ledger/cache integration or reviewed label application was added. Suggestions remain disabled. This is a runnable refusal probe, not the requested completed P09 journey.

The capture request accepts only an exact message schema, extension sender, top frame and fixed localhost URL. The worker checks the active tab and fixture before capture and checks the active tab, fixture fingerprint and screenshot dimensions afterward. Content supplies no crop coordinates. The fixture inspector rejects inputs anywhere in the light DOM, altered target markup and overlapping or nearby elements. Installed-browser assertions verified rejection of a synthetic input and an overlapping rectangle. These checks are experimental and do not establish an arbitrary-page privacy guarantee. Arbitrary-page capture remains disabled.

The installed Chromium probe used the existing test-only copied manifest grant for localhost, an actual Next server and a temporary synthetic database. No browser route was fulfilled. It did not grant all_urls. The UI refused capture. A separate worker permission probe returned the exact Chromium error `Either the '<all_urls>' or 'activeTab' permission is required.` No screenshot bytes are stored in the probe receipt. There were zero observed page POST requests and no provider calls. This is evidence of a missing automation toolbar grant, not evidence that capture is impossible. The smallest next step is to invoke the installed extension through a real toolbar gesture on the exact fixture at device scale 1 and verify the resulting crop bytes. Do not replace this with a broad host grant or relax the fixture checks.

Official Meta documentation at https://dev.meta.ai/docs/image-understanding was rechecked on 2026-11-05. It still documents Responses input_image blocks with a plain string image_url accepting base64 data URLs, alongside input_text, with muse-spark-1.3 in the example. No live request or model accuracy evaluation ran. Live quality remains unverified. No zero-error model claim is supported.

Throughput checkpoint was reduced to the actual capture probe after that permission failure. No independent reviewer ran because this implementation delegate was expressly forbidden to create children. Root-owned independent review remains outstanding. Model the Domain selected strict request and preview result schemas. Boundary Discipline selected exact sender and fixture checks. Prove It Works selected the installed worker permission probe rather than an inferred feasibility claim. Make Operations Idempotent kept uploads absent and capture single-flight, with no retry or spend state.

Evidence is under artifacts/program/P09/crop-recovery. probe.json records the refusal and exact error. probe.png shows the installed panel refusal. installed.log records the focused probe execution. Final verification and commit details belong to handoff.json in that directory. The full provider/cache/consent/review matrix, successful cropped-byte assertion, staleness lifecycle, held-out fixtures, video, performance and independent review remain open. P10 is excluded.
