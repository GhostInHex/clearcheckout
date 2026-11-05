# P06 local preparation checkpoint

Confirmed the clean orchestrator-prepared worktree `/data/home/.t3/worktrees/clearcheckout/t3-093dfecb` at `ce1cf73b4b54ecaa77a3d666bd6f792a085b56c6` before edits. This is the frozen integrated P01-P05 parent. Physical prerequisite is P05 account controls with schema 4; logical prerequisite is P03. No other worktree or parent source was edited. No children, push, PR, merge, deployment, account setup, production access or live provider calls were performed.

## Throughput and design

Blocking inputs for production are approved target, durable filesystem, TLS/domain, backup/key custody, cutover approval and independent verdicts. Independent local work is the Node service package, backup CLI, operational guide and synthetic drill. Shared entrypoint changes are limited to custom startup, plus node-test strict coverage. No migrations or ledger reservation semantics changed. Smallest reviewable delivery is a native Node package with a stopped-writer encrypted snapshot and fresh-instance restoration.

The archive is an authenticated v1 manifest of database and approved media entries. Boundary Discipline selected Zod validation and private key-file input. Model the Domain selected one strict archive schema. Make Operations Idempotent selected fail-closed writer locking, exclusive output and no-overwrite destination creation with atomic state activation. Prove It Works selected actual Next processes and a repeatable fresh restore drill. Type System Discipline keeps external data unknown until parsed, with no casts, any or suppressions. Skill-requested delegation is omitted because this assignment forbids children; independent review belongs to root.

## Delivery and limitations

`deploy/clearcheckout.service` and `deploy/Caddyfile.example` are uninstalled examples. Node 22 uses locked dependencies and native installation on the target OS. The default is one process with durable local DB/media, custom socket identity, TLS proxy, exact origins and secure cookies. A read-only readiness poll checks DB schema/integrity/ledger without resetting state. Graceful shutdown drains requests. A forced termination retains the writer lock and requires proof of stopped writers before manual recovery.

Backup uses better-sqlite3's native online backup API, with a mandatory stopped-writer maintenance window for a consistent media copy. AES-256-GCM authenticates the complete strict manifest. Restore authenticates before writing and checks schema, checksums and SQLite integrity before activation. Existing destinations, symlinks and invalid names are refused. The trusted parent must exclude concurrent untrusted filesystem changes. Archives are memory limited and unsuitable for large datasets. Power-loss fsync durability is not claimed.

Older backups cannot reconstruct post-snapshot provider spend. Existing destinations always refuse restore, including newer allowance state. The mandatory operational accounting fence keeps providers disabled on fresh recovery until the latest ledger and unknown attempts are reconciled. This does not claim cross-account provider caps. No cap is increased and no ledger row is cleared. Production enforcement of provider-disabled recovery remains an operator duty.

Docker was not used because the native persistent Node service package meets the allowed deliverable. No infrastructure was installed. Sample systemd/Caddy configuration has not been installed or tested on a real host. Host persistence, ten-lane/manual evidence, comparative performance, real TLS, mail and independent DeepSeek/GLM verdicts remain open. This is local preparation, not independent hosting or completed P06 deployment.

## Verification

Fresh-worktree direct typecheck and HTTP tests initially failed because generated Next declarations/build were absent. The standard full verifier generates types and builds before HTTP tests. The first drill likewise failed before build. Retained local receipts distinguish those failures from later runs.

Local receipts are under `artifacts/program/P06/` and full verifier receipts under `artifacts/program/P03/`. The actual custom-Next drill passed restart and fresh-path restore of session, preferences, order, media, reserved AI spend and blocked safety state. Backup while the writer runs was refused. Backup unit cases cover wrong key, tamper, truncated envelope/database, future schema, missing source media, cleanup without activation, refusal to overwrite and preservation of a newer destination allowance.

Final command outcomes and commit SHA are reported by the implementation owner. No local test result counts as independent review. npm ci reported nine moderate advisories; no forced upgrade was attempted.

Final working-tree verifier passed with receipt `artifacts/program/P03/ce1cf73b4b54ecaa77a3d666bd6f792a085b56c6-1793861005263/receipt.json`. It passed generated Next types, full strict/source inventory, lint, extension/Next production build, 48 unit tests, all six browser suites, security/provider checks, and production npm-start restart/download checks. The receipt records the parent SHA and dirty source honestly. The final standalone drill passed in `artifacts/program/P06/drill-final.log`. A transient SQL quoting error introduced while an earlier run was active caused that earlier security/strict run to fail; the corrected source passed the final complete rerun. No runtime source changed after that final run. Root must review the resulting commit independently.
