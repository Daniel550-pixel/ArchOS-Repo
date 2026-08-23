# ArchOS Database Migrations

Database schema changes must be applied through versioned migrations before production deployment.

The evidence ledger uses `archos_evidence_ledger` and is defined in `backend/agents/evidence_persistence.py`.

## Production rule

Do **not** call `EvidenceBase.metadata.create_all()` against a production database. `ensure_schema()` is intentionally limited to local bootstrap/tests. Production deployments must use a reviewed migration that creates the evidence table and indexes.

## Migration order

Apply migrations in numeric order:

1. `0001_archos_evidence_ledger.sql` — base evidence table and indexes.
2. `0002_evidence_ledger_immutability.sql` — append-only triggers and insert audit trail.
3. `0003_evidence_ledger_chain.sql` — chain columns and chain-state table.
4. `0004_evidence_chain_backfill.sql` — **one-time controlled backfill** for pre-chain rows.

Do not run `0004` repeatedly on an already-authoritative chain. It is a migration for legacy rows whose `chain_digest` is still null.

## Integrity gate

`.github/workflows/evidence-integrity.yml` applies the base schema and integrity migrations to a clean PostgreSQL 16 instance, validates the required objects, compiles the relevant Python packages, and runs evidence/verification/chain tests when a test suite is present.

Production deployment should additionally run `backend/migrations/verify_evidence_chain.py` after applying `0004` and fail closed when verification returns a non-zero exit code.

## Required migration properties

- `entry_id` unique
- `digest` unique
- indexes on `task_id`, `agent_id`, and `created_at`
- append-only application semantics
- database-enforced UPDATE/DELETE rejection
- insert audit trail
- timezone-aware timestamps
- JSON evidence payload
- deterministic chain digest
- explicit chain state
