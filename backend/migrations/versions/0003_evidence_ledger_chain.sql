-- ArchOS evidence ledger migration 0003
-- Tamper-evident hash chain over evidence entries.

ALTER TABLE archos_evidence_ledger
    ADD COLUMN IF NOT EXISTS previous_digest VARCHAR(64);

ALTER TABLE archos_evidence_ledger
    ADD COLUMN IF NOT EXISTS chain_digest VARCHAR(64);

CREATE INDEX IF NOT EXISTS ix_archos_evidence_chain_digest
    ON archos_evidence_ledger (chain_digest);

-- Existing rows must be backfilled by a reviewed migration runner in commit
-- order before chain verification is enabled. New application writes must set
-- previous_digest to the latest accepted digest and calculate chain_digest
-- over the canonical row payload plus previous_digest.

CREATE TABLE IF NOT EXISTS archos_evidence_chain_state (
    chain_name VARCHAR(80) PRIMARY KEY,
    latest_digest VARCHAR(64),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO archos_evidence_chain_state(chain_name, latest_digest)
VALUES ('default', NULL)
ON CONFLICT (chain_name) DO NOTHING;
