from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Article,
    ArticleEntity,
    Entity,
    Event,
    EventArticle,
    Location,
    Topic,
    ArticleTopic,
)


class WorldModelService:
    """Authoritative persistence boundary for the UAE intelligence world model."""

    @staticmethod
    def _datetime(value: Any) -> Any:
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        return value

    @staticmethod
    async def upsert_article(session: AsyncSession, article: Dict[str, Any]) -> Article:
        existing = await session.get(Article, article["id"])
        if existing is None:
            existing = Article(id=article["id"])
            session.add(existing)

        values = {
            "provider": article.get("provider", article.get("sensor_source", "UAE_NEWS_API")),
            "provider_article_id": article.get("provider_article_id"),
            "title": article["title"],
            "description": article.get("description"),
            "content": article.get("content"),
            "url": article["url"],
            "canonical_url": article["canonical_url"],
            "source_name": article["source_name"],
            "source_domain": article.get("source_domain"),
            "author": article.get("author"),
            "language": article.get("language", "en"),
            "country": article.get("country", "ae"),
            "category": article.get("category"),
            "image_url": article.get("image_url"),
            "content_hash": article["content_hash"],
            "importance_score": article.get("importance_score", 50.0),
            "importance_factors": article.get("importance_factors", {}),
            "confidence_score": article.get("confidence_score", 0.95),
            "confidence_reason": article.get("confidence_reason"),
            "sentiment": article.get("sentiment", "NEUTRAL"),
            "detected_emirate": article.get("detected_emirate", "UAE National"),
            "raw_payload": article.get("raw_payload", {}),
            "processing_status": article.get("processing_status", "PROCESSED"),
            "processing_version": article.get("processing_version", "1.0.0"),
            "published_at": WorldModelService._datetime(article["published_at"]),
            "fetched_at": WorldModelService._datetime(article.get("fetched_at")),
        }
        for field, value in values.items():
            setattr(existing, field, value)
        await session.flush()
        return existing

    @staticmethod
    async def upsert_entity(session: AsyncSession, entity: Dict[str, Any]) -> Entity:
        existing = await session.get(Entity, entity["entity_id"])
        if existing is None:
            existing = Entity(entity_id=entity["entity_id"])
            session.add(existing)
        existing.name = entity["name"]
        existing.canonical_name = entity["canonical_name"]
        existing.entity_type = entity["entity_type"]
        existing.confidence = entity.get("confidence", 0.95)
        existing.aliases = entity.get("aliases", [])
        existing.sector = entity.get("sector")
        existing.emirate = entity.get("emirate")
        existing.mention_count = entity.get("mention_count", 1)
        existing.metadata_json = entity.get("metadata_json", {})
        await session.flush()
        return existing

    @staticmethod
    async def upsert_location(session: AsyncSession, location: Dict[str, Any]) -> Location:
        existing = await session.get(Location, location["location_id"])
        if existing is None:
            existing = Location(location_id=location["location_id"])
            session.add(existing)
        existing.name = location["name"]
        existing.canonical_name = location["canonical_name"]
        existing.latitude = location.get("latitude")
        existing.longitude = location.get("longitude")
        existing.country = "UAE"
        existing.emirate = location["emirate"]
        existing.city = location.get("city")
        existing.district = location.get("district")
        existing.location_type = location.get("location_type", "INFRASTRUCTURE")
        existing.resolution_status = location.get("resolution_status", "RESOLVED")
        existing.confidence = location.get("confidence", 0.95)
        await session.flush()
        return existing

    @staticmethod
    async def upsert_event(session: AsyncSession, event: Dict[str, Any]) -> Event:
        existing = await session.get(Event, event["event_id"])
        if existing is None:
            existing = Event(event_id=event["event_id"])
            session.add(existing)
        for field in (
            "event_type", "title", "description", "location_name", "emirate",
            "importance_score", "importance_factors", "confidence_score",
            "confidence_reason", "status",
        ):
            if field in event:
                setattr(existing, field, event[field])
        await session.flush()
        return existing

    @staticmethod
    async def persist_observation(
        session: AsyncSession,
        article: Dict[str, Any],
        entities: List[Dict[str, Any]],
        locations: List[Dict[str, Any]],
        topics: Optional[List[Dict[str, Any]]] = None,
        event: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Persist one normalized observation and all resolved intelligence links atomically."""
        db_article = await WorldModelService.upsert_article(session, article)

        for entity in entities:
            db_entity = await WorldModelService.upsert_entity(session, entity)
            link = await session.scalar(select(ArticleEntity).where(
                ArticleEntity.article_id == db_article.id,
                ArticleEntity.entity_id == db_entity.entity_id,
            ))
            if link is None:
                session.add(ArticleEntity(
                    article_id=db_article.id,
                    entity_id=db_entity.entity_id,
                    mention_count=entity.get("mention_count", 1),
                    relevance_score=entity.get("relevance_score", 0.9),
                    sentiment=entity.get("sentiment", "NEUTRAL"),
                ))

        for location in locations:
            await WorldModelService.upsert_location(session, location)

        for topic in topics or []:
            db_topic = await session.scalar(select(Topic).where(Topic.code == topic["code"]))
            if db_topic is None:
                db_topic = Topic(
                    topic_id=topic["topic_id"],
                    code=topic["code"],
                    name=topic["name"],
                    category_group=topic.get("category_group", "GENERAL"),
                )
                session.add(db_topic)
                await session.flush()
            link = await session.scalar(select(ArticleTopic).where(
                ArticleTopic.article_id == db_article.id,
                ArticleTopic.topic_id == db_topic.topic_id,
            ))
            if link is None:
                session.add(ArticleTopic(
                    article_id=db_article.id,
                    topic_id=db_topic.topic_id,
                    confidence=topic.get("confidence", 0.9),
                ))

        if event:
            db_event = await WorldModelService.upsert_event(session, event)
            link = await session.scalar(select(EventArticle).where(
                EventArticle.event_id == db_event.event_id,
                EventArticle.article_id == db_article.id,
            ))
            if link is None:
                session.add(EventArticle(
                    event_id=db_event.event_id,
                    article_id=db_article.id,
                    relevance_score=event.get("relevance_score", 0.9),
                    is_primary=True,
                ))

        await session.commit()

    @staticmethod
    async def recent_articles(session: AsyncSession, limit: int = 100) -> List[Article]:
        result = await session.execute(select(Article).order_by(Article.published_at.desc()).limit(limit))
        return list(result.scalars().all())

    @staticmethod
    async def recent_events(session: AsyncSession, limit: int = 100, status: Optional[str] = None) -> List[Event]:
        stmt = select(Event).order_by(Event.last_updated_at.desc()).limit(limit)
        if status and status.upper() != "ALL":
            stmt = stmt.where(Event.status == status.upper())
        result = await session.execute(stmt)
        return list(result.scalars().all())
