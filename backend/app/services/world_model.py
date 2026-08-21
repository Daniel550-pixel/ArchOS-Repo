from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Article, Entity, Event, Location, Topic


class WorldModelService:
    """Authoritative persistence boundary for the UAE intelligence world model."""

    @staticmethod
    async def upsert_article(
        session: AsyncSession,
        article: Dict[str, Any],
    ) -> Article:
        existing = await session.get(Article, article["id"])
        if existing is None:
            existing = Article(id=article["id"])
            session.add(existing)

        scalar_fields = {
            "provider", "provider_article_id", "title", "description", "content",
            "url", "canonical_url", "source_name", "source_domain", "author",
            "language", "country", "category", "image_url", "content_hash",
            "importance_score", "importance_factors", "confidence_score",
            "confidence_reason", "sentiment", "detected_emirate", "raw_payload",
            "processing_status", "processing_version", "published_at", "fetched_at",
        }
        for field in scalar_fields:
            if field not in article:
                continue
            value = article[field]
            if field in {"published_at", "fetched_at"} and isinstance(value, str):
                value = datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
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
    ) -> None:
        """Persist one normalized observation and its resolved intelligence."""
        db_article = await WorldModelService.upsert_article(session, article)

        for entity in entities:
            await WorldModelService.upsert_entity(session, entity)

        for location in locations:
            await WorldModelService.upsert_location(session, location)

        await session.commit()

    @staticmethod
    async def recent_articles(
        session: AsyncSession,
        limit: int = 100,
    ) -> List[Article]:
        result = await session.execute(
            select(Article).order_by(Article.published_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def recent_events(
        session: AsyncSession,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> List[Event]:
        stmt = select(Event).order_by(Event.last_updated_at.desc()).limit(limit)
        if status and status.upper() != "ALL":
            stmt = stmt.where(Event.status == status.upper())
        result = await session.execute(stmt)
        return list(result.scalars().all())
