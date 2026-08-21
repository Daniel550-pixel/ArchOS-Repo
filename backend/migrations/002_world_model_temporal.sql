-- ArchOS Phase 5.5: temporal UAE World Model.
-- Apply through the project's database migration runner before production startup.

CREATE TABLE IF NOT EXISTS world_observations (
    observation_id VARCHAR(100) PRIMARY KEY,
    subject_type VARCHAR(50) NOT NULL,
    subject_id VARCHAR(100) NOT NULL,
    predicate VARCHAR(255) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_id VARCHAR(100) REFERENCES sources(source_id),
    article_id VARCHAR(100) REFERENCES articles(id) ON DELETE SET NULL,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE SET NULL,
    observed_at TIMESTAMP NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    state_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_world_obs_subject_time ON world_observations(subject_type, subject_id, observed_at);
CREATE INDEX IF NOT EXISTS ix_world_obs_validity ON world_observations(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS ix_world_obs_predicate_time ON world_observations(predicate, observed_at);
CREATE INDEX IF NOT EXISTS ix_world_obs_source ON world_observations(source_id);

CREATE TABLE IF NOT EXISTS entity_state_versions (
    state_id VARCHAR(100) PRIMARY KEY,
    entity_id VARCHAR(100) NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NULL,
    derived_from_observation_id VARCHAR(100) REFERENCES world_observations(observation_id),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_entity_state_version UNIQUE(entity_id, version)
);

CREATE INDEX IF NOT EXISTS ix_entity_state_current ON entity_state_versions(entity_id, valid_until);
CREATE INDEX IF NOT EXISTS ix_entity_state_validity ON entity_state_versions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS ix_entity_state_observation ON entity_state_versions(derived_from_observation_id);
