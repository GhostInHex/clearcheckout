# P07 sandbox payment checkpoint

Prepared branch is t3/sandbox-paypal-checkout at base 608db8ed7a0ab287f8b4dd8fe7ee8dd39f46f145. Actual containing physical parent is t3/local-hosting-backup-restore. Logical dependencies are P04 and P06. Only this prepared checkout was changed. Schema 5 reserves durable sandbox request keys, provider order identity, capture reservation and verified webhook deduplication. P08 must not reserve a schema version.

The server adapter fixes its API origin to https://api-m.sandbox.paypal.com. Redirect following is disabled. OAuth client credentials never enter client code. Every transport operation has a ten-second abort deadline. Keys are persisted before network work. Capture has a durable compare-and-set reservation. Unknown capture outcomes use authenticated retrieval only. Creation uncertainty without an order ID needs operator reconciliation and cannot start another payment. The immutable P04 snapshot remains authoritative. Provider retrieval checks order identity, attempt identity, invoice order/revision, merchant payee, USD amount and completed final capture. Browser callback tokens are compared to the retrieved provider order. Browser receipt claims are not accepted.

The authenticated /payment page requires exact confirmation and a separate approval link click. It uses redirect approval rather than automating a PayPal window. Callback capture requires an explicit button. Completed demo orders remain distinct. The page currently requires entering an existing owned order ID; shopper discovery and interaction polish remain open. A missing provider is honestly unavailable. Cancellation after provider work remains disallowed by the inherited domain. Capture reconciliation does not repeat capture.

Webhook signatures are checked through the fixed sandbox verification endpoint. Events only select an existing bound attempt. Authenticated provider retrieval supplies payment evidence. Duplicate event IDs are persisted after reconciliation. Provider events cannot directly mark an attempt paid. Event ordering cannot replace an already paid result. Webhook retrieval transport failures may need explicit authenticated reconciliation.

Required server environment names are PAYPAL_SANDBOX_ENABLED, PAYPAL_MODE, PAYPAL_SANDBOX_CLIENT_ID, PAYPAL_SANDBOX_CLIENT_SECRET, PAYPAL_SANDBOX_MERCHANT_ID, PAYPAL_SANDBOX_WEBHOOK_ID and PUBLIC_ORIGIN. Enable must be true and mode must be sandbox. Credentials must belong to a sandbox business REST app with Orders create/read/capture and webhook signature verification access. Configure that same app's webhook ID and business merchant ID. Subscribe to CHECKOUT.ORDER.APPROVED and PAYMENT.CAPTURE pending/completed/denied notifications. Root must obtain credentials through its secure secret tool and authorize actual sandbox interaction. No secret values were read or requested here. Real buyer approval must be performed by the user. Production hosting, TLS, webhook reachability, credentials, custody and independent DeepSeek/GLM verdicts remain blocked.

Official documentation checked on 2026-11-05 before implementation:

- https://developer.paypal.com/api/orders/v2
- https://developer.paypal.com/api/rest/reference/idempotency/
- https://developer.paypal.com/api/rest/webhooks/rest/
- https://developer.paypal.com/api/webhooks/v1
- https://developer.paypal.com/sdk/js/reference/

PayPal currently documents JavaScript SDK v6 sessions. This implementation uses returned sandbox approval navigation instead of bundling an SDK. Request-ID retention is provider limited; this implementation does not assume indefinite provider deduplication or repeat capture after uncertainty.

Model the Domain preserves the existing state machine. Boundary Discipline validates provider JSON and configuration. Make Operations Idempotent selects durable keys and a single capture reservation. Prove It Works selects real Next with an explicitly test-only injected local fixture. No children, independent review, push, PR, merge, deploy, billing, real mail, live model, PayPal API or money movement were performed.

Local evidence is recorded under artifacts/program/P07 and the inherited full verifier's exact-head receipt directory. Mocked browser evidence must never be described as a real sandbox pass. Real sandbox, ten live lanes, comparison performance and operator review video remain unverified. This checkpoint is local implementation work and cannot establish completed P07 verification or merge readiness.

An approved notification preserves active callback readiness. A mismatched callback token becomes unknown without capture. The added domain regression covers this notification and callback ordering. The first full verifier can record dirty source during this correction; only the final clean-head receipt establishes exact-head local verification.
