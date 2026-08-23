# ArchOS Database Migrations

Database schema changes must be applied through versioned migrations before production deployment.

The evidence ledger uses `archos_evidence_ledger` and is defined in `backend/agents/evidence_persistence.py`.

## Production rule

Do **not** call `EvidenceBase.metadata.create_all()` against a production database. `ensure_schema()` is intentionally limited to local bootstrap/tests. Production deployments must use a reviewed migration that creates the evidence table and indexes.

## Required migration properties

- `entry_id` unique
- `digest` unique
- indexes on `task_id`, `agent_id`, and `created_at`
- append-only application semantics
- timezone-aware timestamps
- JSON evidence payload

Migration tooling can be introduced independently without changing the evidence store contract.
