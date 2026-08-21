-- ArchOS Phase 5.2: durable governance and event persistence.
-- Apply through the project's database migration runner before production startup.

CREATE SEQUENCE IF NOT EXISTS audit_record_sequence;
CREATE SEQUENCE IF NOT EXISTS durable_event_sequence;

CREATE TABLE IF NOT EXISTS audit_records (
    event_id VARCHAR(36) PRIMARY KEY,
    sequence INTEGER NOT NULL UNIQUE DEFAULT nextval('audit_record_sequence'),
    occurred_at TIMESTAMP NOT NULL,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    authority_level VARCHAR(50) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    tenant_id VARCHAR(255),
    correlation_id VARCHAR(255),
    reason TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS ix_audit_records_occurred_at ON audit_records (occurred_at);
CREATE INDEX IF NOT EXISTS ix_audit_records_actor ON audit_records (actor);
CREATE INDEX IF NOT EXISTS ix_audit_records_action ON audit_records (action);
CREATE INDEX IF NOT EXISTS ix_audit_records_decision ON audit_records (decision);
CREATE INDEX IF NOT EXISTS ix_audit_records_tenant_id ON audit_records (tenant_id);
CREATE INDEX IF NOT EXISTS ix_audit_actor_time ON audit_records (actor, occurred_at);

CREATE TABLE IF NOT EXISTS durable_events (
    event_id VARCHAR(36) PRIMARY KEY,
    sequence INTEGER NOT NULL UNIQUE DEFAULT nextval('durable_event_sequence'),
    event_type VARCHAR(255) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    producer VARCHAR(255) NOT NULL,
    correlation_id VARCHAR(255),
    causation_id VARCHAR(36),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_durable_events_occurred_at ON durable_events (occurred_at);
CREATE INDEX IF NOT EXISTS ix_durable_events_event_type ON durable_events (event_type);
CREATE INDEX IF NOT EXISTS ix_durable_events_producer ON durable_events (producer);
CREATE INDEX IF NOT EXISTS ix_durable_events_correlation_id ON durable_events (correlation_id);
CREATE INDEX IF NOT EXISTS ix_durable_events_causation_id ON durable_events (causation_id);
CREATE INDEX IF NOT EXISTS ix_durable_events_type_time ON durable_events (event_type, occurred_at);
