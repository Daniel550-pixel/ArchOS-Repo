from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select
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

        if valid_until is not None and valid_until <= valid_from:
            raise ValueError("valid_until must be later than valid_from")

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
            state_version=1,
        )
        session.add(observation)

        if subject_type == "ENTITY":
            # Serialize state transitions per entity inside the transaction.
            # PostgreSQL row locking prevents concurrent observations from
            # allocating the same state version or closing the same current row.
            entity = await session.execute(
                select(Entity)
                .where(Entity.entity_id == subject_id)
                .with_for_update()
            )
            entity = entity.scalar_one_or_none()

            if entity:
                current_result = await session.execute(
                    select(EntityStateVersion)
                    .where(
                        EntityStateVersion.entity_id == subject_id,
                        EntityStateVersion.valid_until.is_(None),
                    )
                    .order_by(EntityStateVersion.version.desc())
                    .with_for_update()
                    .limit(1)
                )
                current = current_result.scalar_one_or_none()

                if current:
                    if valid_from < current.valid_from:
                        raise ValueError(
                            "Out-of-order observation cannot precede the current entity state"
                        )
                    state_version = current.version + 1
                    state = dict(current.state or {})
                    current.valid_until = valid_from
                else:
                    state_version = 1
                    state = {}

                state[predicate] = value
                observation.state_version = state_version
                session.add(
                    EntityStateVersion(
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
                )

        await session.flush()
        return observation

    async def get_current_state(
        self,
        session: AsyncSession,
        entity_id: str,
    ) -> Optional[EntityStateVersion]:
        result = await session.execute(
            select(EntityStateVersion)
            .where(
                EntityStateVersion.entity_id == entity_id,
                EntityStateVersion.valid_until.is_(None),
            )
            .order_by(EntityStateVersion.version.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_state_at(
        self,
        session: AsyncSession,
        entity_id: str,
        at: datetime,
    ) -> Optional[EntityStateVersion]:
        result = await session.execute(
            select(EntityStateVersion)
            .where(
                EntityStateVersion.entity_id == entity_id,
                EntityStateVersion.valid_from <= at,
                (EntityStateVersion.valid_until.is_(None) | (EntityStateVersion.valid_until > at)),
            )
            .order_by(EntityStateVersion.version.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_state_history(
        self,
        session: AsyncSession,
        entity_id: str,
    ) -> list[EntityStateVersion]:
        result = await session.execute(
            select(EntityStateVersion)
            .where(EntityStateVersion.entity_id == entity_id)
            .order_by(EntityStateVersion.version.asc())
        )
        return list(result.scalars().all())

    async def get_observations(
        self,
        session: AsyncSession,
        *,
        subject_type: str,
        subject_id: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> list[WorldObservation]:
        query = select(WorldObservation).where(
            WorldObservation.subject_type == subject_type,
            WorldObservation.subject_id == subject_id,
        )
        if start is not None:
            query = query.where(WorldObservation.observed_at >= start)
        if end is not None:
            query = query.where(WorldObservation.observed_at <= end)
        result = await session.execute(query.order_by(WorldObservation.observed_at.asc()))
        return list(result.scalars().all())
