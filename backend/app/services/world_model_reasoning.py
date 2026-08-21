from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Entity, EntityStateVersion, WorldObservation


class WorldModelReasoningService:
    """Read-only reasoning boundary over authoritative temporal World Model state."""

    async def entity_state(
        self,
        session: AsyncSession,
        entity_id: str,
        *,
        at: Optional[datetime] = None,
    ) -> Optional[dict[str, Any]]:
        entity = await session.get(Entity, entity_id)
        if not entity:
            return None

        query = select(EntityStateVersion).where(EntityStateVersion.entity_id == entity_id)
        if at is None:
            query = query.where(EntityStateVersion.valid_until.is_(None))
        else:
            query = query.where(
                EntityStateVersion.valid_from <= at,
                (EntityStateVersion.valid_until.is_(None) | (EntityStateVersion.valid_until > at)),
            )
        query = query.order_by(EntityStateVersion.version.desc()).limit(1)
        result = await session.execute(query)
        state = result.scalar_one_or_none()
        if not state:
            return {
                "entity_id": entity.entity_id,
                "name": entity.name,
                "state": {},
                "state_version": None,
                "evidence": [],
            }

        evidence_result = await session.execute(
            select(WorldObservation)
            .where(WorldObservation.observation_id == state.derived_from_observation_id)
        )
        evidence = evidence_result.scalar_one_or_none()

        return {
            "entity_id": entity.entity_id,
            "name": entity.name,
            "entity_type": entity.entity_type,
            "state": state.state,
            "state_version": state.version,
            "valid_from": state.valid_from.isoformat(),
            "valid_until": state.valid_until.isoformat() if state.valid_until else None,
            "confidence": state.confidence,
            "provenance": state.provenance,
            "evidence": [
                {
                    "observation_id": evidence.observation_id,
                    "predicate": evidence.predicate,
                    "observed_at": evidence.observed_at.isoformat(),
                    "confidence": evidence.confidence,
                    "source_id": evidence.source_id,
                    "article_id": evidence.article_id,
                    "event_id": evidence.event_id,
                    "provenance": evidence.provenance,
                }
            ] if evidence else [],
        }

    async def observations(
        self,
        session: AsyncSession,
        *,
        subject_type: str,
        subject_id: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> list[dict[str, Any]]:
        query = select(WorldObservation).where(
            WorldObservation.subject_type == subject_type,
            WorldObservation.subject_id == subject_id,
        )
        if start:
            query = query.where(WorldObservation.observed_at >= start)
        if end:
            query = query.where(WorldObservation.observed_at <= end)
        result = await session.execute(query.order_by(WorldObservation.observed_at.asc()))
        return [
            {
                "observation_id": o.observation_id,
                "predicate": o.predicate,
                "value": o.value,
                "observed_at": o.observed_at.isoformat(),
                "valid_from": o.valid_from.isoformat(),
                "valid_until": o.valid_until.isoformat() if o.valid_until else None,
                "state_version": o.state_version,
                "confidence": o.confidence,
                "provenance": o.provenance,
                "source_id": o.source_id,
                "article_id": o.article_id,
                "event_id": o.event_id,
            }
            for o in result.scalars().all()
        ]
