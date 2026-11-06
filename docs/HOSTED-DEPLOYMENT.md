# Deploy the Vercel frontend with a persistent backend

The frontend and backend use the same reviewed commit. Vercel serves Next pages and forwards `/api/*` before its local API route. One persistent Node 22 service owns SQLite, media, sessions, payment evidence, and provider accounting. A successful frontend build alone is not an application health check.

## Build and configuration

Build the backend with `VERCEL` unset. Run `npm ci`, `npm run build`, then `npm start`. Never substitute `next start`. Keep the database and media on a persistent local filesystem outside the release directory. Use the existing `deploy/clearcheckout.service` and `deploy/Caddyfile.example` as host templates. Review host paths and permissions before installation.

Configure both Production and Preview frontend builds in Vercel:

- `CC_BACKEND_ORIGIN` is the exact HTTPS origin of the persistent backend. Do not include a trailing slash, path, query, or credentials.
- `CC_FRONTEND_ORIGIN` is the exact public frontend HTTPS origin. For the existing submission this is `https://clearcheckout-one.vercel.app`.

The backend origin must differ from the frontend and Vercel deployment aliases. Hosted builds refuse missing or invalid configuration. Vercel builds use `.next-vercel`; backend builds use `.next`. Never copy a frontend build into a backend release. The backend launcher refuses `VERCEL=1` to prevent recursive forwarding.

Set `PUBLIC_ORIGIN` on the backend to the exact production frontend origin. Set `PUBLIC_ORIGINS` only for separately approved preview origins. Keep `COOKIE_SECURE=true`. Do not allow every Vercel preview origin. An unapproved preview can render pages, but its account mutations must fail. Do not expose provider or database credentials to Vercel frontend builds.

Use a TLS ingress that replaces forwarded identity headers. Keep the application listener private. Set `TRUST_PROXY=loopback` only when the immediate trusted ingress is loopback and its header replacement is verified. The custom launcher replaces incoming `x-cc-client` and signature headers. Do not bypass its signature check or trust arbitrary forwarded client IPs. Without a verified client-IP chain, rate limiting conservatively groups requests by the observed ingress address. This can limit shared traffic and is not a claim of independent per-shopper IP limits.

## Upgrade the existing submission backend

The documented submission origin is `https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech`. It is a demo origin whose availability depends on the sandbox remaining running. Inspect its current release and service before using it. Do not restore forwarding to the legacy JavaScript process without upgrading it to the matching Next release.

1. Record the old service definition, release commit, actual database path, media directory, schema version, and runtime configuration privately. Do not print secrets or copy them into the release.
2. Prepare a separate release directory at the reviewed commit. Install and build without production credentials. Run `npm run verify` with synthetic data.
3. Schedule a write pause. Stop and drain the old writer. Confirm no process can write the database or media. The legacy process does not participate in the new writer lock, so the lock alone cannot establish this condition.
4. Take a consistent database backup and media snapshot while stopped. Encrypt the snapshot and keep its key separately. Preserve the original state offline. Follow `docs/OPERATIONS.md` for the backup format, permissions, and provider accounting requirements.
5. Rehearse the upgrade on a private copy. Run the new service against that copy with live model, payment, and mail credentials absent. Verify migrations, existing synthetic session and order persistence, media, ledger reservations, and blocked provider safety state. Keep the copy isolated from production traffic.
6. Configure the new service with the preserved authoritative data path, exact origins, secure cookies, and private listener. Start exactly one writer with `npm start`. Check `/readyz` directly through the trusted host ingress.
7. Build a Vercel preview with the reviewed backend origin and an explicitly approved preview origin. Run the acceptance command below. Promote only after security and persistence checks pass.
8. Verify the production URL after cutover. Retain the previous release for schema-compatible code rollback. Do not replace current data with an older snapshot for routine rollback. If schema compatibility fails, keep maintenance active and use the documented recovery procedure with providers disabled.

The service templates are persistent-host examples, not proof that a host has been provisioned. Configure process restart, readiness alerts, disk-space alerts, backup age monitoring, encrypted off-host custody, and a restore drill before treating the demo as durable hosting.

## Verify before release

`npm run verify` builds and tests the backend, then builds a Vercel-mode frontend and exercises its real external rewrite against a local TLS ingress and the real custom Node backend. It checks signup, session cookies, preferences, orders, backend restart persistence, forbidden origins, and replacement of forged client-identity headers. The local certificate is trusted only by that test child. It does not disable TLS verification.

Run hosted acceptance only when authorized to create one retained synthetic account:

```sh
CC_SMOKE_ORIGIN=https://clearcheckout-one.vercel.app CC_SMOKE_CREATE_ACCOUNT=1 npm run verify:hosted
```

The command checks signup, Secure/HttpOnly/SameSite cookies, authenticated reads, logout revocation, and login. It never logs account credentials or cookies and never calls a provider. It retains one synthetic account per run. Do not run it on every readiness poll. Use `/readyz` on the backend for read-only readiness monitoring. Hosted acceptance does not prove restart persistence; the isolated runtime test and host cutover drill cover that separately.

Do not mark release complete until the public account journey passes. A home page returning 200 or a Vercel check marked success cannot replace that result.
