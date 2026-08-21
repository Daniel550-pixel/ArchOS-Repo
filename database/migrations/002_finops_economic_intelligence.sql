-- Enable TimescaleDB extension for high-frequency telemetry
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==========================================
-- FINOPS & ECONOMIC INTELLIGENCE SCHEMAS
-- ==========================================

-- 1. Tenant Economic Profiles
-- Stores pricing tiers, usage caps, and economic metadata for each tenant
CREATE TABLE IF NOT EXISTS tenant_economic_profiles (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('PRO', 'STUDIO', 'ENTERPRISE', 'STRATEGIC', 'GOVERNMENT')),
    max_monthly_budget DECIMAL(15,2), -- Optional hard cap
    cost_per_token_override DECIMAL(10,6), -- Overrides default if set
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Real-time Usage Telemetry (TimescaleDB Hypertable)
-- High-frequency ingestion of inference, simulation, and storage metrics
CREATE TABLE IF NOT EXISTS usage_telemetry (
    time TIMESTAMPTZ NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    operation_type VARCHAR(30) NOT NULL, -- e.g., 'INFERENCE', 'SIMULATION', 'STORAGE'
    model_used VARCHAR(50), -- e.g., 'gemini-flash', 'gpt-4o'
    tokens_input INTEGER,
    tokens_output INTEGER,
    compute_seconds DECIMAL(8,3),
    storage_gb_delta DECIMAL(10,4),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Convert to hypertable for optimized time-series queries
SELECT create_hypertable('usage_telemetry', 'time', chunk_time_interval => INTERVAL '1 day');

-- Indexes for rapid aggregation by tenant and operation
CREATE INDEX idx_usage_tenant_op ON usage_telemetry (tenant_id, operation_type, time DESC);
CREATE INDEX idx_usage_model ON usage_telemetry (model_used, time DESC);

-- 3. Cost Calculation Rules
-- Dynamic pricing rules that can be updated without schema changes
CREATE TABLE IF NOT EXISTS cost_calculation_rules (
    rule_id SERIAL PRIMARY KEY,
    operation_type VARCHAR(30) NOT NULL,
    model_used VARCHAR(50),
    unit_cost DECIMAL(10,6) NOT NULL, -- Cost per token, second, or GB
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    description TEXT
);

-- Seed initial cost rules based on current provider rates
INSERT INTO cost_calculation_rules (operation_type, model_used, unit_cost, description) VALUES
('INFERENCE', 'gemini-flash', 0.0000003, 'Gemini Flash Input Token'),
('INFERENCE', 'gemini-flash', 0.0000025, 'Gemini Flash Output Token'),
('INFERENCE', 'gpt-4o', 0.0000025, 'GPT-4o Input Token'),
('INFERENCE', 'gpt-4o', 0.0000100, 'GPT-4o Output Token'),
('SIMULATION', NULL, 0.05, 'Per Compute Second (GPU)'),
('STORAGE', NULL, 0.10, 'Per GB Storage');

-- 4. Aggregated Daily Cost Summary (Materialized View / Continuous Aggregate)
-- Pre-aggregates costs for fast dashboard rendering and billing
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_tenant_costs WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket_day,
    tenant_id,
    operation_type,
    SUM(tokens_input + tokens_output) AS total_tokens,
    SUM(compute_seconds) AS total_compute_seconds,
    SUM(storage_gb_delta) AS total_storage_gb,
    -- Calculate cost dynamically using latest applicable rule
    SUM(
        CASE 
            WHEN operation_type = 'INFERENCE' THEN 
                (tokens_input * COALESCE((SELECT unit_cost FROM cost_calculation_rules WHERE operation_type='INFERENCE' AND model_used=ut.model_used ORDER BY effective_from DESC LIMIT 1), 0)) +
                (tokens_output * COALESCE((SELECT unit_cost FROM cost_calculation_rules WHERE operation_type='INFERENCE' AND model_used=ut.model_used AND effective_from <= ut.time ORDER BY effective_from DESC LIMIT 1), 0))
            WHEN operation_type = 'SIMULATION' THEN 
                compute_seconds * (SELECT unit_cost FROM cost_calculation_rules WHERE operation_type='SIMULATION' ORDER BY effective_from DESC LIMIT 1)
            ELSE 0
        END
    ) AS estimated_cost_usd
FROM usage_telemetry ut
GROUP BY bucket_day, tenant_id, operation_type;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('daily_tenant_costs',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- 5. Economic Alerts & Thresholds
CREATE TABLE IF NOT EXISTS economic_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    alert_type VARCHAR(30) NOT NULL, -- e.g., 'BUDGET_THRESHOLD', 'ANOMALOUS_SPIKE'
    threshold_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_econ_alerts_tenant ON economic_alerts (tenant_id, acknowledged, triggered_at DESC);
