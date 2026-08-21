from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import EntityStateVersion


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass(frozen=True)
class WorldSnapshot:
    snapshot_id: str
    created_at: datetime
    as_of: datetime
    entities: Dict[str, Dict[str, Any]]
    digest: str


@dataclass
class SimulationBranch:
    branch_id: str
    snapshot_id: str
    created_at: datetime
    horizon: datetime
    changes: Dict[str, Dict[str, Any]] = field(default_factory=dict)


class SimulationEngine:
    """In-memory scenario engine. Live World Model state is never mutated."""

    async def create_snapshot(
        self,
        session: AsyncSession,
        *,
        as_of: Optional[datetime] = None,
        entity_ids: Optional[list[str]] = None,
    ) -> WorldSnapshot:
        as_of = as_of or utc_now()
        query = select(EntityStateVersion).where(
            EntityStateVersion.valid_from <= as_of,
            (EntityStateVersion.valid_until.is_(None) | (EntityStateVersion.valid_until > as_of)),
        )
        if entity_ids:
            query = query.where(EntityStateVersion.entity_id.in_(entity_ids))
        result = await session.execute(query.order_by(EntityStateVersion.entity_id.asc()))
        states = list(result.scalars().all())

        entities: Dict[str, Dict[str, Any]] = {}
        for state in states:
            entities[state.entity_id] = {
                "entity_id": state.entity_id,
                "version": state.version,
                "state": dict(state.state or {}),
                "valid_from": state.valid_from.isoformat(),
                "valid_until": state.valid_until.isoformat() if state.valid_until else None,
                "confidence": state.confidence,
                "provenance": dict(state.provenance or {}),
            }

        canonical = repr(sorted(entities.items())).encode("utf-8")
        digest = sha256(canonical).hexdigest()
        return WorldSnapshot(
            snapshot_id=str(uuid4()),
            created_at=utc_now(),
            as_of=as_of,
            entities=entities,
            digest=digest,
        )

    def create_branch(
        self,
        snapshot: WorldSnapshot,
        *,
        horizon: datetime,
        changes: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> SimulationBranch:
        if horizon <= snapshot.as_of:
            raise ValueError("Simulation horizon must be later than snapshot as_of")
        return SimulationBranch(
            branch_id=str(uuid4()),
            snapshot_id=snapshot.snapshot_id,
            created_at=utc_now(),
            horizon=horizon,
            changes={k: dict(v) for k, v in (changes or {}).items()},
        )

    def apply_change(
        self,
        branch: SimulationBranch,
        *,
        entity_id: str,
        changes: Dict[str, Any],
    ) -> SimulationBranch:
        branch.changes.setdefault(entity_id, {}).update(changes)
        return branch

    def materialize(self, snapshot: WorldSnapshot, branch: SimulationBranch) -> Dict[str, Dict[str, Any]]:
        if branch.snapshot_id != snapshot.snapshot_id:
            raise ValueError("Simulation branch does not belong to supplied snapshot")
        state = {entity_id: dict(row["state"]) for entity_id, row in snapshot.entities.items()}
        for entity_id, changes in branch.changes.items():
            state.setdefault(entity_id, {}).update(changes)
        return state
