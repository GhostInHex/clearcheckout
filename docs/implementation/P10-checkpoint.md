# P10 implementation checkpoint

P10 remains incomplete. This continuation started clean at 009a045f597a6aa9d728c7612e75aa6f70e622d5 on t3/merchant-command-adapters in /data/home/.t3/worktrees/clearcheckout/t3-89d7577d. No children, push, PR, merge, deployment, live provider calls, secrets, environment files or port 3000 were used.

## Installed merchant adapters

The installed panel now selects an explicit controlled-store capability on the configured account origin and the two controlled demo paths. Other origins and routes expose scan and navigation only. The copied test extension substitutes the ephemeral loopback fixture origin and grants only that host. Production permissions are unchanged.

A bounded MessageChannel protocol accepts only read-cart and revision-bound removal requests. Strict schemas exclude generic paths, credentials, purchase operations, extra fields and ambiguous item IDs. Reviews include the exact item ID, name, quantity, cart revision, and total amount, currency and provenance. Page handlers validate origin, source and envelope. The page remains inside the first-party trust boundary. This protocol does not authenticate arbitrary merchant pages or treat DOM contents as verified state.

Store A reads a validated first-party API response through the app's session and performs removal through the existing SQLite transaction. It rejects stale revisions, wrong names, missing items and empty carts, clears reviewedRevision and invalidates payment reservations. The extension receives only cart data. It never receives cookies or the P09 labels credential. Store B owns a synchronous revision and quantity reference and explicitly reports client-local totals. Confirmation checks current state before changing it.

The installed panel has item selection, review preview, confirm and cancel. Keyboard confirmation uses focused native buttons. Cancel changes no cart state. Removal cannot be undone by label undo. Store A gained guided back and owned-label undo controls. Store B gained guided navigation and back controls. Existing DOM-total readout remains explicitly unverified and separate from controlled cart totals.

## Verification and limits

The installed production Next/MV3 driver is tests/p10-installed-adapters.ts. It covers both stores, exact selection, preview, cancel, stale rejection, keyboard confirmation, resulting totals and an unknown route. It performs real onboarding and first-party requests without route fulfillment. Evidence belongs under artifacts/program/P10/installed-adapters. Unit coverage checks wrong identity, quantity, revision, duplicate IDs, changed totals, unsupported origins and forbidden protocol operations. Existing focused suites remain required after the final commit. The receipt records actual outcomes and SHA.

Model the Domain selected typed request, review, result and capability variants. Boundary Discipline kept mutation enforcement with each merchant state owner. Prove It Works selected production Next and actual installed MV3 rather than route mocks. Deslop removed an inline service wrapper before commit. Delegation was skipped under the explicit no-children instruction.

## Remaining gates

This unit is not merge-ready. Required follow-up includes installed wrong/ambiguous/replaced-control cases, complete keyboard back/undo focus assertions, payment-phrase refusal through the installed surface, complete single-channel web announcements, approved-label memory with expiry/fingerprint/reset/override behavior, idle observer checks, the required 30 to 60 second review video, performance evidence and root-owned independent DeepSeek/GLM reviews. No real assistive technology, toolbar activation, performance comparison or independent review verdict is claimed.
