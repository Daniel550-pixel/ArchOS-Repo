from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, Float, Integer, ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Source(Base):
    __tablename__ = "sources"
    source_id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=True, index=True)
    country = Column(String(10), default="ae", index=True)
    reliability_score = Column(Float, default=0.90)
    category = Column(String(100), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    articles = relationship("Article", back_populates="source_rel")

class Article(Base):
    __tablename__ = "articles"
    id = Column(String(100), primary_key=True)
    provider = Column(String(50), nullable=False, index=True)
    provider_article_id = Column(String(500), nullable=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String(1000), nullable=False)
    canonical_url = Column(String(1000), nullable=False, index=True)
    source_name = Column(String(255), nullable=False, index=True)
    source_domain = Column(String(255), nullable=True, index=True)
    author = Column(String(255), nullable=True)
    language = Column(String(10), default="en", index=True)
    country = Column(String(10), default="ae", index=True)
    category = Column(String(100), nullable=True, index=True)
    image_url = Column(String(1000), nullable=True)
    content_hash = Column(String(64), nullable=False, unique=True, index=True)
    importance_score = Column(Float, default=50.0, index=True)
    importance_factors = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.95)
    confidence_reason = Column(Text, nullable=True)
    sentiment = Column(String(50), default="NEUTRAL")
    detected_emirate = Column(String(100), default="UAE National", index=True)
    raw_payload = Column(JSON, default=dict)
    processing_status = Column(String(50), default="PROCESSED", index=True)
    processing_version = Column(String(20), default="1.0.0")
    published_at = Column(DateTime, nullable=False, index=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source_id = Column(String(100), ForeignKey("sources.source_id"), nullable=True)
    source_rel = relationship("Source", back_populates="articles")
    entities = relationship("ArticleEntity", back_populates="article", cascade="all, delete-orphan")
    topics = relationship("ArticleTopic", back_populates="article", cascade="all, delete-orphan")
    event_associations = relationship("EventArticle", back_populates="article")
    alerts = relationship("Alert", back_populates="article")
    __table_args__ = (
        Index("ix_articles_pub_importance", "published_at", "importance_score"),
        Index("ix_articles_emirate_pub", "detected_emirate", "published_at"),
    )

class Entity(Base):
    __tablename__ = "entities"
    entity_id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    canonical_name = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, default=0.95)
    aliases = Column(JSON, default=list)
    sector = Column(String(100), nullable=True, index=True)
    emirate = Column(String(100), nullable=True)
    mention_count = Column(Integer, default=1)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    articles = relationship("ArticleEntity", back_populates="entity")

class ArticleEntity(Base):
    __tablename__ = "article_entities"
    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(100), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_id = Column(String(100), ForeignKey("entities.entity_id", ondelete="CASCADE"), nullable=False, index=True)
    mention_count = Column(Integer, default=1)
    relevance_score = Column(Float, default=0.9)
    sentiment = Column(String(50), default="NEUTRAL")
    context_snippet = Column(Text, nullable=True)
    article = relationship("Article", back_populates="entities")
    entity = relationship("Entity", back_populates="articles")
    __table_args__ = (UniqueConstraint("article_id", "entity_id", name="uq_article_entity"),)

class Location(Base):
    __tablename__ = "locations"
    location_id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    canonical_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    country = Column(String(10), default="UAE")
    emirate = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    location_type = Column(String(50), default="INFRASTRUCTURE")
    resolution_status = Column(String(50), default="RESOLVED")
    confidence = Column(Float, default=0.95)
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    event_id = Column(String(100), primary_key=True)
    event_type = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    location_name = Column(String(255), nullable=True)
    emirate = Column(String(100), default="UAE National", index=True)
    importance_score = Column(Float, default=60.0, index=True)
    importance_factors = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.90)
    confidence_reason = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", index=True)
    first_detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    supporting_articles = relationship("EventArticle", back_populates="event", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="event")

class EventArticle(Base):
    __tablename__ = "event_articles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(100), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    article_id = Column(String(100), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    relevance_score = Column(Float, default=0.9)
    is_primary = Column(Boolean, default=False)
    event = relationship("Event", back_populates="supporting_articles")
    article = relationship("Article", back_populates="event_associations")
    __table_args__ = (UniqueConstraint("event_id", "article_id", name="uq_event_article"),)

class Topic(Base):
    __tablename__ = "topics"
    topic_id = Column(String(100), primary_key=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category_group = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    articles = relationship("ArticleTopic", back_populates="topic")

class ArticleTopic(Base):
    __tablename__ = "article_topics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(String(100), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(100), ForeignKey("topics.topic_id", ondelete="CASCADE"), nullable=False, index=True)
    confidence = Column(Float, default=0.9)
    article = relationship("Article", back_populates="topics")
    topic = relationship("Topic", back_populates="articles")
    __table_args__ = (UniqueConstraint("article_id", "topic_id", name="uq_article_topic"),)

class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(String(100), primary_key=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="HIGH", index=True)
    alert_type = Column(String(100), nullable=False, index=True)
    trigger_rule = Column(String(255), nullable=False)
    related_article_id = Column(String(100), ForeignKey("articles.id"), nullable=True)
    related_event_id = Column(String(100), ForeignKey("events.event_id"), nullable=True)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    article = relationship("Article", back_populates="alerts")
    event = relationship("Event", back_populates="alerts")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    job_id = Column(String(100), primary_key=True)
    provider = Column(String(50), nullable=False)
    status = Column(String(50), default="SUCCESS")
    articles_fetched = Column(Integer, default=0)
    articles_inserted = Column(Integer, default=0)
    articles_duplicated = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, index=True)

class AuditRecord(Base):
    __tablename__ = "audit_records"
    event_id = Column(String(36), primary_key=True)
    sequence = Column(Integer, nullable=False, unique=True, index=True)
    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    actor = Column(String(255), nullable=False, index=True)
    action = Column(String(255), nullable=False, index=True)
    authority_level = Column(String(50), nullable=False)
    decision = Column(String(20), nullable=False, index=True)
    tenant_id = Column(String(255), nullable=True, index=True)
    correlation_id = Column(String(255), nullable=True, index=True)
    reason = Column(Text, nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    previous_hash = Column(String(64), nullable=False)
    record_hash = Column(String(64), nullable=False, unique=True)
    __table_args__ = (Index("ix_audit_actor_time", "actor", "occurred_at"),)

class DurableEvent(Base):
    __tablename__ = "durable_events"
    event_id = Column(String(36), primary_key=True)
    sequence = Column(Integer, nullable=False, unique=True, index=True)
    event_type = Column(String(255), nullable=False, index=True)
    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    producer = Column(String(255), nullable=False, index=True)
    correlation_id = Column(String(255), nullable=True, index=True)
    causation_id = Column(String(36), nullable=True, index=True)
    payload = Column(JSON, nullable=False, default=dict)
    payload_hash = Column(String(64), nullable=False)
    __table_args__ = (Index("ix_durable_events_type_time", "event_type", "occurred_at"),)
