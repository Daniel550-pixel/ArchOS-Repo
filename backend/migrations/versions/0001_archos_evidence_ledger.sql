-- ArchOS evidence ledger schema migration 0001
-- Apply through the deployment migration runner, not application startup.

CREATE TABLE IF NOT EXISTS archos_evidence_ledger (
    id BIGSERIAL PRIMARY KEY,
    entry_id VARCHAR(80) NOT NULL UNIQUE,
    task_id VARCHAR(120) NOT NULL,
    agent_id VARCHAR(120) NOT NULL,
    source VARCHAR(500) NOT NULL,
    claim TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reality VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    digest VARCHAR(64) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS ix_archos_evidence_task_id
    ON archos_evidence_ledger (task_id);
CREATE INDEX IF NOT EXISTS ix_archos_evidence_agent_id
    ON archos_evidence_ledger (agent_id);
CREATE INDEX IF NOT EXISTS ix_archos_evidence_created_at
    ON archos_evidence_ledger (created_at);

-- Application code treats this table as append-only. Updates/deletes must be
-- prohibited through the production database role or an equivalent policy.
