CREATE TABLE IF NOT EXISTS causal_relationships (
    relationship_id VARCHAR(100) PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'CAUSAL',
    coefficient DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    rationale TEXT NOT NULL DEFAULT '',
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    provenance VARCHAR(2000) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_causal_active_source_target
    ON causal_relationships(active, source, target);
CREATE INDEX IF NOT EXISTS ix_causal_validity
    ON causal_relationships(valid_from, valid_until);
