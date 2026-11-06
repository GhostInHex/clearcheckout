# Local hosting preparation

This package has not been deployed or approved for production. P06 remains blocked on an approved host, storage and backup destination, TLS/domain ownership, independent review, and an authorized cutover. Next.js is the framework. The plan's Next.ts filename is a typo.

## Host package

Use one Linux host, one service user, Node 22.x and `npm ci` from the locked source. Build native better-sqlite3 on that same OS/architecture with Python, make and C++ available. Run `npm run build` before activation. Do not copy node_modules from another runtime or architecture. No Docker daemon or public listener is needed for this local package.

Review `deploy/clearcheckout.service` and `deploy/Caddyfile.example` before installing anything. They are examples, not executed configuration. The service uses the custom `npm start` socket-signing launcher. Never substitute `next start`, standalone output or an Express proxy. Bind application traffic to loopback port 3080. Only the host TLS proxy may reach it. Configure firewall and host access separately. The proxy replaces forwarded client identity and the launcher trusts loopback only. Exposing the internal port permits identity spoofing.

Mount a durable local filesystem at `/var/lib/clearcheckout`, owned by the service user with mode 0700. Keep database.sqlite, WAL/SHM, writer lock and media together. Do not use NFS or multiple writers. Ensure the .next/cache directory exists and is writable by the service user. Code and public/extension downloads are read-only to the service. Build includes extension and public assets. Never put runtime secrets in source, public assets, NEXT_PUBLIC variables, archives or build-time environment files. The build/verify runner refuses automatic Next env files.

Store runtime environment in a root-controlled mode 0600 service environment file outside the release tree. Set PUBLIC_ORIGIN to the exact HTTPS origin and PUBLIC_ORIGINS only to explicitly approved exact origins. Set COOKIE_SECURE=true, TRUST_PROXY=loopback, and DB_PATH as above. No wildcard origins. Confirm secure HttpOnly SameSite cookies and rejection of an unapproved Origin before traffic. Leave live model/payment/mail credentials absent until separately authorized. Staging needs its own keys and allowance, never a clone of a live ledger with the same live key.

## Readiness and shutdown

GET /readyz returns generic ready or unavailable and no app data. Each poll opens SQLite read-only and checks schema, integrity and ledger presence. It never migrates or changes reservations. Startup initializes migrations once. The adjacent .writer directory prevents cooperating application and backup processes from overlapping. SIGTERM stops accepting requests, drains active requests, closes Next, and releases the lock. A forced exit keeps the lock and fails closed. After proving no process owns the database and checking SQLite integrity, an operator may remove that stale lock. Never auto-delete a lock based on PID age. The lock is a local deployment guard, not an OS-level defense against arbitrary SQLite clients.

## Backup and restore

Backups contain sensitive account data, password hashes, hashed sessions, account tokens, orders, payment attempts, AI calls/safety and media. Restrict backup access, encrypt off-host storage, audit access, set retention and deletion policy before production. Suggested initial retention is seven daily and four weekly copies, subject to an approved privacy policy. Monitor free disk space and backup age. Keep encryption keys in a separately controlled secret store and rehearse key recovery.

Create a random raw 32-byte key file with mode 0600 outside the release, media and database directories. Supply its path only. The tool never logs the key or data. The v1 envelope uses Node AES-256-GCM, random 96-bit nonce, 128-bit authentication tag and authenticated CCBACK01 header. Its encrypted strict manifest records version, creation time, file SHA-256 checksums, database and media bytes. It is memory bounded to 128 MiB plaintext and designed for this small demo, not large datasets.

Stop and drain the writer before backup. This mandatory maintenance window keeps media consistent with the SQLite native online-backup snapshot. A stopped writer is enforced through the same lock used by npm start. Do not write via unmanaged SQLite clients or modify media during the operation. Ensure media exists, even when empty. Unknown media filenames and symlinks fail closed. No env files or arbitrary directory trees are copied.

```
npx tsx scripts/backup.ts create /var/lib/clearcheckout/database.sqlite /var/lib/clearcheckout/media /secure/backup.key /private/backups/new.ccbackup
npx tsx scripts/backup.ts restore /private/backups/new.ccbackup /secure/backup.key /private/restore-new
```

Restore requires a nonexistent destination under a private, trusted parent. It refuses existing destinations, including empty directories, symlinks and any destination holding a newer ledger. It authenticates the entire archive before writing, validates manifest/checksums/schema/integrity/budget fields, writes private staging files, then atomically exposes destination/state. Failure removes staging. Start a fresh service with DB_PATH=destination/state/database.sqlite. Do not copy only the DB or discard media. Destination and parent must be on one local filesystem with sufficient space. Protect the parent from concurrent untrusted filesystem modifications. This version does not promise power-loss durability beyond filesystem rename guarantees.

## Accounting fence and activation

A backup cannot know spend incurred after its snapshot. Therefore every restored instance must initially run WITHOUT live model/payment/mail credentials. Never reconnect an old snapshot to the same shared provider key merely because destination is fresh. The operational lower-bound fence is mandatory provider-disabled recovery until an operator reconciles all post-snapshot AI reservations and unknown payment attempts against the latest authoritative ledger/provider records. Preserve every reservation, including failed/unknown calls, and ai_safety blocked state. Never lower caps, clear rows or reset a budget to make a restore pass. If the latest accounting state is unavailable, keep provider access disabled or use an independently capped new staging account/key with separate accounting. An app ledger is not a cross-account provider cap. File-newness checks cannot establish provider-global usage.

## Cutover and rollback

Obtain explicit production approval after independent DeepSeek/GLM verdicts, host storage and TLS validation, alert ownership, backup destination/key custody, and a fresh-instance drill. Freeze incoming writes, drain the old process, snapshot, restore to a new path, run readiness plus signup/session/preferences/order/media checks with synthetic data and providers disabled, then reconcile accounting before enabling providers or switching proxy traffic. Retain the previous release and state offline. Record release SHA, schema version and backup ID in private operations records without user data.

Rollback code only when it supports the current schema. Never roll schema 4 back to code supporting an earlier version. Never use an old DB snapshot as a routine release rollback. Keep the latest ledger and payment attempts. Disaster recovery follows the provider-disabled fence above. Unknown payments require reconciliation rather than retry/reset.

Alert on readiness failures, process exits/stale locks, disk exhaustion, failed/old backups, restore-drill failures, AI safety blocking and unexpected spend. Use a local monitor or authenticated private monitor; do not expose diagnostic endpoints. Application health/backup outputs are generic. Keep proxy access logs disabled until a reviewed redaction policy exists. Do not log cookies, Authorization, request bodies, account identifiers, email, tokens or provider payloads. Next/framework unexpected-error logging still requires production log review and restricted log access. This local package does not claim a complete production observability system.

## Verified reference APIs

Reviewed official [Next self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting), [better-sqlite3 backup API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md), and [Node crypto API](https://nodejs.org/docs/latest-v22.x/api/crypto.html). Native backup uses Database.backup rather than copying a live WAL database. The host must independently verify installed Node support and OS security updates before production.
