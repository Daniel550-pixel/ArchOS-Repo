from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Entity, EntityStateVersion, WorldObservation


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _observation_id(subject_type: str, subject_id: str, predicate: str, observed_at: datetime) -> str:
    raw = f"{subject_type}|{subject_id}|{predicate}|{observed_at.isoformat()}|{uuid4()}"
    return sha256(raw.encode()).hexdigest()[:32]


class WorldStateService:
    """Authoritative temporal state transitions for the UAE World Model."""

    async def record_observation(
        self,
        session: AsyncSession,
        *,
        subject_type: str,
        subject_id: str,
        predicate: str,
        value: Dict[str, Any],
        observed_at: Optional[datetime] = None,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None,
        confidence: float = 0.90,
        provenance: Optional[Dict[str, Any]] = None,
        source_id: Optional[str] = None,
        article_id: Optional[str] = None,
        event_id: Optional[str] = None,
    ) -> WorldObservation:
        observed_at = observed_at or utc_now()
        valid_from = valid_from or observed_at
        confidence = max(0.0, min(1.0, confidence))

        previous = await session.scalar(
            select(WorldObservation)
            .where(
                WorldObservation.subject_type == subject_type,
                WorldObservation.subject_id == subject_id,
                WorldObservation.predicate == predicate,
            )
            .order_by(WorldObservation.observed_at.desc())
            .limit(1)
        )

        version = (previous.state_version + 1) if previous else 1

        observation = WorldObservation(
            observation_id=_observation_id(subject_type, subject_id, predicate, observed_at),
            subject_type=subject_type,
            subject_id=subject_id,
            predicate=predicate,
            value=value,
            source_id=source_id,
            article_id=article_id,
            event_id=event_id,
            observed_at=observed_at,
            valid_from=valid_from,
            valid_until=valid_until,
            confidence=confidence,
            provenance=provenance or {},
            state_version=version,
        )
        session.add(observation)

        if subject_type == "ENTITY":
            entity = await session.get(Entity, subject_id)
            if entity:
                state_count = await session.scalar(
                    select(func.count(EntityStateVersion.state_id)).where(
                        EntityStateVersion.entity_id == subject_id
                    )
                )
                state_version = int(state_count or 0) + 1

                current = await session.scalar(
                    select(EntityStateVersion)
                    .where(
                        EntityStateVersion.entity_id == subject_id,
                        EntityStateVersion.valid_until.is_(None),
                    )
                    .order_by(EntityStateVersion.version.desc())
                    .limit(1)
                )
                if current:
                    current.valid_until = valid_from

                state = dict(current.state) if current else {}
                state[predicate] = value
                state_row = EntityStateVersion(
                    state_id=str(uuid4()),
                    entity_id=subject_id,
                    version=state_version,
                    state=state,
                    valid_from=valid_from,
                    valid_until=valid_until,
                    derived_from_observation_id=observation.observation_id,
                    confidence=confidence,
                    provenance=provenance or {},
                )
                session.add(state_row)

        await session.flush()
        return observation
