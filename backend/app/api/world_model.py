from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.database import Article, Entity, Event, Location
from app.services.world_model import WorldModelService
from app.services.world_model_reasoning import WorldModelReasoningService

router = APIRouter(prefix="/world-model", tags=["UAE World Model"])
reasoning = WorldModelReasoningService()


def _article_out(article: Article) -> dict:
    return {
        "id": article.id, "provider": article.provider, "provider_article_id": article.provider_article_id,
        "title": article.title, "description": article.description, "url": article.url,
        "canonical_url": article.canonical_url, "source_name": article.source_name,
        "source_domain": article.source_domain, "category": article.category,
        "importance_score": article.importance_score, "importance_factors": article.importance_factors,
        "confidence_score": article.confidence_score, "confidence_reason": article.confidence_reason,
        "detected_emirate": article.detected_emirate, "processing_version": article.processing_version,
        "published_at": article.published_at.isoformat() if article.published_at else None,
    }


def _event_out(event: Event) -> dict:
    return {
        "event_id": event.event_id, "event_type": event.event_type, "title": event.title,
        "description": event.description, "location_name": event.location_name, "emirate": event.emirate,
        "importance_score": event.importance_score, "importance_factors": event.importance_factors,
        "confidence_score": event.confidence_score, "confidence_reason": event.confidence_reason,
        "status": event.status, "first_detected_at": event.first_detected_at.isoformat() if event.first_detected_at else None,
        "last_updated_at": event.last_updated_at.isoformat() if event.last_updated_at else None,
    }


@router.get("/articles")
async def list_world_model_articles(limit: int = Query(100, ge=1, le=500), emirate: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Article).order_by(Article.published_at.desc()).limit(limit)
    if emirate and emirate.upper() != "ALL":
        stmt = stmt.where(Article.detected_emirate.ilike(f"%{emirate}%"))
    result = await db.execute(stmt)
    articles = list(result.scalars().all())
    return {"items": [_article_out(a) for a in articles], "total": len(articles), "source": "postgresql"}


@router.get("/events")
async def list_world_model_events(limit: int = Query(100, ge=1, le=500), status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    events = await WorldModelService.recent_events(db, limit=limit, status=status)
    return {"items": [_event_out(e) for e in events], "total": len(events), "source": "postgresql"}


@router.get("/entities")
async def list_world_model_entities(limit: int = Query(500, ge=1, le=2000), entity_type: Optional[str] = None, emirate: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Entity).order_by(Entity.mention_count.desc()).limit(limit)
    if entity_type and entity_type.upper() != "ALL": stmt = stmt.where(Entity.entity_type == entity_type)
    if emirate and emirate.upper() != "ALL": stmt = stmt.where(Entity.emirate.ilike(f"%{emirate}%"))
    result = await db.execute(stmt)
    entities = list(result.scalars().all())
    return {"items": [{"entity_id": e.entity_id, "name": e.name, "canonical_name": e.canonical_name,
        "entity_type": e.entity_type, "confidence": e.confidence, "aliases": e.aliases,
        "sector": e.sector, "emirate": e.emirate, "mention_count": e.mention_count} for e in entities],
        "total": len(entities), "source": "postgresql"}


@router.get("/locations")
async def list_world_model_locations(limit: int = Query(500, ge=1, le=2000), emirate: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Location).order_by(Location.name.asc()).limit(limit)
    if emirate and emirate.upper() != "ALL": stmt = stmt.where(Location.emirate.ilike(f"%{emirate}%"))
    result = await db.execute(stmt)
    locations = list(result.scalars().all())
    return {"items": [{"location_id": l.location_id, "name": l.name, "canonical_name": l.canonical_name,
        "latitude": l.latitude, "longitude": l.longitude, "emirate": l.emirate, "city": l.city,
        "district": l.district, "location_type": l.location_type, "resolution_status": l.resolution_status,
        "confidence": l.confidence} for l in locations], "total": len(locations), "source": "postgresql"}


@router.get("/metrics")
async def world_model_metrics(db: AsyncSession = Depends(get_db)):
    article_count = await db.scalar(select(func.count()).select_from(Article))
    entity_count = await db.scalar(select(func.count()).select_from(Entity))
    event_count = await db.scalar(select(func.count()).select_from(Event))
    location_count = await db.scalar(select(func.count()).select_from(Location))
    return {"source": "postgresql", "articles": int(article_count or 0), "entities": int(entity_count or 0),
            "events": int(event_count or 0), "locations": int(location_count or 0)}


@router.get("/entities/{entity_id}/state")
async def entity_state(entity_id: str, at: Optional[datetime] = Query(None), db: AsyncSession = Depends(get_db)):
    state = await reasoning.entity_state(db, entity_id, at=at)
    if state is None:
        raise HTTPException(status_code=404, detail="World Model entity not found")
    return {"source": "postgresql", "temporal": at is not None, **state}


@router.get("/entities/{entity_id}/observations")
async def entity_observations(
    entity_id: str,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if start and end and end < start:
        raise HTTPException(status_code=400, detail="end must be later than or equal to start")
    observations = await reasoning.observations(db, subject_type="ENTITY", subject_id=entity_id, start=start, end=end)
    return {"source": "postgresql", "entity_id": entity_id, "items": observations, "total": len(observations)}
