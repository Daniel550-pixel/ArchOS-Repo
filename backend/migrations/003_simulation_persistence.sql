CREATE TABLE IF NOT EXISTS simulation_snapshots (
    snapshot_id VARCHAR(100) PRIMARY KEY,
    as_of TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    digest VARCHAR(64) NOT NULL UNIQUE,
    entity_count INTEGER NOT NULL DEFAULT 0,
    state JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS simulation_branches (
    branch_id VARCHAR(100) PRIMARY KEY,
    snapshot_id VARCHAR(100) NOT NULL REFERENCES simulation_snapshots(snapshot_id) ON DELETE CASCADE,
    parent_branch_id VARCHAR(100) NULL REFERENCES simulation_branches(branch_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    horizon TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ix_sim_snapshot_as_of ON simulation_snapshots(as_of);
CREATE INDEX IF NOT EXISTS ix_sim_branch_snapshot_horizon ON simulation_branches(snapshot_id, horizon);
CREATE INDEX IF NOT EXISTS ix_sim_branch_parent ON simulation_branches(parent_branch_id);
