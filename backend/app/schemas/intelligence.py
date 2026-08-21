from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EntityOut(BaseModel):
    entity_id: str
    name: str
    canonical_name: str
    entity_type: str
    confidence: float
    aliases: List[str] = Field(default_factory=list)
    sector: Optional[str] = None
    emirate: Optional[str] = None
    mention_count: int = 1

class LocationOut(BaseModel):
    location_id: str
    name: str
    canonical_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emirate: str
    city: Optional[str] = None
    district: Optional[str] = None
    location_type: str
    resolution_status: str
    confidence: float

class TopicOut(BaseModel):
    topic_id: str
    code: str
    name: str
    category_group: str
    description: Optional[str] = None

class ArticleSummaryOut(BaseModel):
    id: str
    provider: str
    title: str
    description: Optional[str] = None
    url: str
    source_name: str
    source_domain: Optional[str] = None
    author: Optional[str] = None
    published_at: datetime
    image_url: Optional[str] = None
    category: Optional[str] = None
    importance_score: float
    confidence_score: float
    detected_emirate: str
    sentiment: str = "NEUTRAL"
    created_at: datetime

class ArticleDetailOut(ArticleSummaryOut):
    content: Optional[str] = None
    canonical_url: str
    content_hash: str
    importance_factors: Dict[str, Any] = Field(default_factory=dict)
    confidence_reason: Optional[str] = None
    processing_status: str
    processing_version: str
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    entities: List[EntityOut] = Field(default_factory=list)
    topics: List[TopicOut] = Field(default_factory=list)
    locations: List[LocationOut] = Field(default_factory=list)

class EventOut(BaseModel):
    event_id: str
    event_type: str
    title: str
    description: str
    location_name: Optional[str] = None
    emirate: str
    importance_score: float
    importance_factors: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float
    confidence_reason: Optional[str] = None
    status: str
    first_detected_at: datetime
    last_updated_at: datetime
    supporting_articles_count: int = 1
    supporting_articles: List[ArticleSummaryOut] = Field(default_factory=list)

class AlertOut(BaseModel):
    alert_id: str
    title: str
    description: str
    severity: str
    alert_type: str
    trigger_rule: str
    related_article_id: Optional[str] = None
    related_event_id: Optional[str] = None
    acknowledged: bool
    created_at: datetime

class IngestionStatusOut(BaseModel):
    active_provider: str
    provider_status: str
    total_articles: int
    total_events: int
    total_entities: int
    total_alerts: int
    last_run_at: Optional[datetime] = None
    last_run_status: str
    scheduler_running: bool
    scheduler_interval_minutes: int

class SearchNewsParams(BaseModel):
    query: Optional[str] = None
    emirate: Optional[str] = None
    category: Optional[str] = None
    topic: Optional[str] = None
    source: Optional[str] = None
    min_importance: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
