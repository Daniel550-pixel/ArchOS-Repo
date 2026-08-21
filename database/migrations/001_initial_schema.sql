-- ============================================================================
-- UAE NEWS INTELLIGENCE DATABASE INITIAL SCHEMA (POSTGRESQL + PGVECTOR COMPATIBLE)
-- ============================================================================

-- 1. Sources Table
CREATE TABLE IF NOT EXISTS sources (
    source_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    country VARCHAR(10) DEFAULT 'ae',
    reliability_score DOUBLE PRECISION DEFAULT 0.90,
    category VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_sources_name ON sources(name);
CREATE INDEX IF NOT EXISTS ix_sources_domain ON sources(domain);

-- 2. Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(100) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_article_id VARCHAR(500),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url VARCHAR(1000) NOT NULL,
    canonical_url VARCHAR(1000) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_domain VARCHAR(255),
    author VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    country VARCHAR(10) DEFAULT 'ae',
    category VARCHAR(100),
    image_url VARCHAR(1000),
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    importance_score DOUBLE PRECISION DEFAULT 50.0,
    importance_factors JSONB DEFAULT '{}'::jsonb,
    confidence_score DOUBLE PRECISION DEFAULT 0.95,
    confidence_reason TEXT,
    sentiment VARCHAR(50) DEFAULT 'NEUTRAL',
    detected_emirate VARCHAR(100) DEFAULT 'UAE National',
    raw_payload JSONB DEFAULT '{}'::jsonb,
    processing_status VARCHAR(50) DEFAULT 'PROCESSED',
    processing_version VARCHAR(20) DEFAULT '1.0.0',
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_id VARCHAR(100) REFERENCES sources(source_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_articles_pub_importance ON articles(published_at DESC, importance_score DESC);
CREATE INDEX IF NOT EXISTS ix_articles_emirate ON articles(detected_emirate);
CREATE INDEX IF NOT EXISTS ix_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS ix_articles_content_hash ON articles(content_hash);
CREATE INDEX IF NOT EXISTS ix_articles_canonical_url ON articles(canonical_url);

-- 3. Entities Table
CREATE TABLE IF NOT EXISTS entities (
    entity_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 0.95,
    aliases JSONB DEFAULT '[]'::jsonb,
    sector VARCHAR(100),
    emirate VARCHAR(100),
    mention_count INT DEFAULT 1,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS ix_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS ix_entities_sector ON entities(sector);

-- 4. Article Entities (Many-to-Many Join)
CREATE TABLE IF NOT EXISTS article_entities (
    id SERIAL PRIMARY KEY,
    article_id VARCHAR(100) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    entity_id VARCHAR(100) NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    mention_count INT DEFAULT 1,
    relevance_score DOUBLE PRECISION DEFAULT 0.90,
    sentiment VARCHAR(50) DEFAULT 'NEUTRAL',
    context_snippet TEXT,
    CONSTRAINT uq_article_entity UNIQUE(article_id, entity_id)
);

CREATE INDEX IF NOT EXISTS ix_article_entities_art ON article_entities(article_id);
CREATE INDEX IF NOT EXISTS ix_article_entities_ent ON article_entities(entity_id);

-- 5. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    location_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    country VARCHAR(10) DEFAULT 'UAE',
    emirate VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    location_type VARCHAR(50) DEFAULT 'INFRASTRUCTURE',
    resolution_status VARCHAR(50) DEFAULT 'RESOLVED',
    confidence DOUBLE PRECISION DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_locations_emirate ON locations(emirate);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(100) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    location_name VARCHAR(255),
    emirate VARCHAR(100) DEFAULT 'UAE National',
    importance_score DOUBLE PRECISION DEFAULT 60.0,
    importance_factors JSONB DEFAULT '{}'::jsonb,
    confidence_score DOUBLE PRECISION DEFAULT 0.90,
    confidence_reason TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS ix_events_importance ON events(importance_score DESC);

-- 7. Event Articles Table
CREATE TABLE IF NOT EXISTS event_articles (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    article_id VARCHAR(100) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    relevance_score DOUBLE PRECISION DEFAULT 0.90,
    is_primary BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_event_article UNIQUE(event_id, article_id)
);

-- 8. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    topic_id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_group VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE INDEX IF NOT EXISTS ix_topics_code ON topics(code);
CREATE INDEX IF NOT EXISTS ix_topics_category ON topics(category_group);

-- 9. Article Topics Table
CREATE TABLE IF NOT EXISTS article_topics (
    id SERIAL PRIMARY KEY,
    article_id VARCHAR(100) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    confidence DOUBLE PRECISION DEFAULT 0.90,
    CONSTRAINT uq_article_topic UNIQUE(article_id, topic_id)
);

-- 10. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'HIGH',
    alert_type VARCHAR(100) NOT NULL,
    trigger_rule VARCHAR(255) NOT NULL,
    related_article_id VARCHAR(100) REFERENCES articles(id) ON DELETE SET NULL,
    related_event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE SET NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_alerts_severity ON alerts(severity);

-- 11. Processing Jobs Table
CREATE TABLE IF NOT EXISTS processing_jobs (
    job_id VARCHAR(100) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    articles_fetched INT DEFAULT 0,
    articles_inserted INT DEFAULT 0,
    articles_duplicated INT DEFAULT 0,
    latency_ms DOUBLE PRECISION DEFAULT 0.0,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_processing_jobs_exec ON processing_jobs(executed_at DESC);
