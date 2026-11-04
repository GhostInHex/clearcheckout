# ClearCheckout submission build

The user has five hours as of the Nov 4 build kickoff. The goal is a usable submission product for blind and low-vision shoppers. This document supersedes the scope of the earlier five-hour demo plan at `/data/workspace/hackathons/clearcheckout-5h-plan.md`.

## Launch journey

A visitor understands the product, creates an account, completes onboarding, installs the extension or opens the embedded demo, repairs confusing checkout controls, reviews an order, explicitly confirms, and receives an accurately described result. Preferences persist. The shopper can return, sign in, and change their settings.

## Required implementation

- A polished accessible landing page, product dashboard, onboarding, preferences, and demo store. Use a coherent visual design, visible focus, semantic controls, responsive layouts, and reduced-motion support.
- Real local account signup, login, logout, persisted sessions, hashed passwords, isolated user preferences, and database migrations or reproducible database initialization. Do not present browser-only profiles as secure accounts.
- A working MV3 extension with a content script and accessible panel. Share scan, repair, command, and checkout logic with an embedded demo so judges can try it without installing.
- DOM-based detection and accessible-name repairs for controls with reliable context. Reapply repairs on rerender. Mark unknown controls honestly. Provide an optional server-side AI adapter only when a supported API is configured. Do not fabricate model results or send input values, card data, passwords, or full-page screenshots.
- Keyboard commands, guidance through cart and delivery, order read-back, and an explicit confirmation state machine. Exact confirmation only. Changing the order invalidates confirmation. Distinguish cancelled, failed, completed demo, and verified payment states.
- A clearly labeled simulated payment for a runnable no-secrets demonstration. A real PayPal sandbox adapter, if feasible, must create and capture server-side, validate amounts and currency, and require the actual PayPal approval. Never report a demo payment as real.
- Input validation, bounded requests, per-user usage limits, safe cookies and session handling, clear provider errors, and an environment example with no secrets.
- Automated checks for important user behavior and payment invariants. A real build and browser automation of signup, onboarding, preferences persistence, repair, and checkout. Accessibility checks must report actual results.
- README setup commands, extension installation, honest limitations, a short demo script, and submission copy. Produce deployable build artifacts. Public deployment is a separate approval step.

## Deferred

SaaS subscription billing, general-store payment automation, universal store compatibility, voice recognition, SAM segmentation, and extensive merchant adapters are post-submission work. No empty controls or invented analytics to imply these exist. Password recovery and email verification may be explicitly deferred if they would prevent the main journey shipping.

## Throughput checkpoint

- Blocking first steps. Commit this brief, choose the stack and domain contracts, and install dependencies.
- Independent workstreams. UI, extension, server, and verification can be separate directories after contracts are fixed. Keep the integrated journey under one implementation owner.
- Shared mutable state. One owner controls root configuration and database schema. Any worker must use an isolated checkout. No concurrent edits in a shared checkout.
- Smallest safe decomposition. One implementation owner builds a connected initial version. Independent review follows against the actual artifact. Avoid design bakeoffs that delay the runnable baseline under this deadline.

## Verification and handoff

Passing compilation alone is insufficient. Record commands and observed behavior. A reviewer must distinguish runnable local product, configured integrations, simulated behavior, and anything not yet verified. Never claim full production readiness from a hackathon build.
