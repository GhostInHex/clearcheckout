# P10 implementation checkpoint

P10 remains incomplete. This continuation started clean at 009a045f597a6aa9d728c7612e75aa6f70e622d5 on t3/merchant-command-adapters in /data/home/.t3/worktrees/clearcheckout/t3-89d7577d. No children, push, PR, merge, deployment, live provider calls, secrets, environment files or port 3000 were used.

## Installed merchant adapters

The installed panel now selects an explicit controlled-store capability on the configured account origin and the two controlled demo paths. Other origins and routes expose scan and navigation only. The copied test extension substitutes the ephemeral loopback fixture origin and grants only that host. Production permissions are unchanged.

A bounded MessageChannel protocol accepts only read-cart and revision-bound removal requests. Strict schemas exclude generic paths, credentials, purchase operations, extra fields and ambiguous item IDs. Reviews include the exact item ID, name, quantity, cart revision, and total amount, currency and provenance. Page handlers validate origin, source and envelope. The page remains inside the first-party trust boundary. This protocol does not authenticate arbitrary merchant pages or treat DOM contents as verified state.

Store A reads a validated first-party API response through the app's session and performs removal through the existing SQLite transaction. It rejects stale revisions, wrong names, missing items and empty carts, clears reviewedRevision and invalidates payment reservations. The extension receives only cart data. It never receives cookies or the P09 labels credential. Store B owns a synchronous revision and quantity reference and explicitly reports client-local totals. Confirmation checks current state before changing it.

The installed panel has item selection, review preview, confirm and cancel. Keyboard confirmation uses focused native buttons. Cancel changes no cart state. Removal cannot be undone by label undo. Store A gained guided back and owned-label undo controls. Store B gained guided navigation and back controls. Existing DOM-total readout remains explicitly unverified and separate from controlled cart totals.

## Verification and limits

The installed production Next/MV3 driver is tests/p10-installed-adapters-browser.ts. It covers both stores, exact selection, preview, cancel, stale rejection, keyboard confirmation, resulting totals and an unknown route. It performs real onboarding and first-party requests without route fulfillment. Evidence belongs under artifacts/program/P10/installed-adapters. Unit coverage checks wrong identity, quantity, revision, duplicate IDs, changed totals, unsupported origins and forbidden protocol operations. Existing focused suites remain required after the final commit. The receipt records actual outcomes and SHA.

Model the Domain selected typed request, review, result and capability variants. Boundary Discipline kept mutation enforcement with each merchant state owner. Prove It Works selected production Next and actual installed MV3 rather than route mocks. Deslop removed an inline service wrapper before commit. Delegation was skipped under the explicit no-children instruction.

## Remaining gates

This unit is not merge-ready. Required follow-up includes installed wrong/ambiguous/replaced-control cases, complete keyboard back/undo focus assertions, payment-phrase refusal through the installed surface, complete single-channel web announcements, approved-label memory with expiry/fingerprint/reset/override behavior, idle observer checks, the required 30 to 60 second review video, performance evidence and root-owned independent DeepSeek/GLM reviews. No real assistive technology, toolbar activation, performance comparison or independent review verdict is claimed.

## Approved merchant-label memory continuation

This continuation started clean at a9789385fc27f05bce9f83e2f291543066710293. It adds explicit per-label approval to both web stores and the installed panel on those same controlled routes. Memory accepts only bounded nonsensitive merchant-provided button labels from the P08 registry. It does not remember AI suggestions, unknown provenance, input labels, arbitrary text or field values. P09 synthetic crop acceptance remains separate and unchanged.

The storage boundary validates strict records, origin, unique keys, maximum 20 entries, 80-character labels, 12,000-character serialized input and seven-day expiry. SHA-256 fingerprints contain no raw markup or values in storage. Restoring a label requires a unique matching current merchant control and an exact match to its current explicit label. A changed control or merchant override invalidates the approval. Inspect lists the candidate labels and saved count. Forget deletes approvals while leaving current assistance for deliberate undo. Restoration runs only when assistance mounts. Inspect and mutation observation never replay repairs after undo. The storage parser and mount accept an injected clock without a production test switch.

The web and installed runtimes own their repairs separately. The memory driver clears web-owned repairs before opening installed assistance, so installed undo proves ownership without deleting another runtime's labels. Earlier runtime attempts exposed premature Store A mounting and a nested section inheriting the installed panel's fixed positioning. Store A now mounts memory after its order is loaded. The memory region uses a div, so Undo remains reachable. The driver waits for actual merchant controls before installing the copied extension.

The new deterministic storage test checks malformed, oversized, foreign-origin, duplicate, sensitive and expired records. The actual production Next/MV3 driver is tests/p10-memory-browser.ts. It checks both stores in both experiences with approval, reload, override, reset, malformed storage, replacement fingerprint invalidation, expiry and undo without replay. Its final version also checks duplicate and sensitive controls. Runtime screenshots and command logs are under artifacts/program/P10/approved-memory. The exact committed SHA and final command outcomes belong to receipt.json there. Build precedes runtime checks. No real AT or toolbar activation claim is made. The copied manifest grants only the ephemeral fixture host and substitutes that origin in the copied bundle; production permissions stay unchanged.

Model the Domain keeps saved approval records separate from current DOM ownership. Boundary Discipline validates origin storage before domain use. Prove It Works requires actual Next and installed MV3 drivers. Deslop keeps the change limited to the existing registry and its callers. All work remains local. Independent review belongs to root and was not attempted here.

P10 remains incomplete. Remaining work includes the broader installed adversarial cart cases and complete keyboard/back/focus evidence, a single coordinated web announcement channel, P09 AI-label memory if required beyond this conservative merchant-label subset, the 30 to 60 second review video, performance comparisons and root-owned independent reviews. Final validation failures, if any, are recorded in the receipt rather than treated as passes. This checkpoint is not merge-ready.

The first clean-head verification at d2e1eaf90b73f38eabb5c621c9b71428a32e1854 passed 72 tests but failed regression because a baseline partial button-name locator also matched the new approval action. Approval now uses a named group showing the reviewed label and a separate native Remember reviewed label button. The existing merchant action retains its name and baseline tests remain unchanged. Final evidence uses the subsequent committed SHA.
