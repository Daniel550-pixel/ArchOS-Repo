from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulation import SimulationBranch, SimulationSnapshot


class ScenarioStore:
    """Transactional persistence boundary for simulation lineage."""

    async def save_snapshot(
        self,
        session: AsyncSession,
        *,
        as_of: datetime,
        state: Dict[str, Dict[str, Any]],
        digest: str,
    ) -> SimulationSnapshot:
        existing = await session.scalar(
            select(SimulationSnapshot).where(SimulationSnapshot.digest == digest)
        )
        if existing:
            return existing
        snapshot = SimulationSnapshot(
            snapshot_id=str(uuid4()),
            as_of=as_of,
            digest=digest,
            entity_count=len(state),
            state=state,
        )
        session.add(snapshot)
        await session.flush()
        return snapshot

    async def create_branch(
        self,
        session: AsyncSession,
        *,
        snapshot_id: str,
        name: str,
        horizon: datetime,
        changes: Optional[Dict[str, Dict[str, Any]]] = None,
        parent_branch_id: Optional[str] = None,
    ) -> SimulationBranch:
        snapshot = await session.get(SimulationSnapshot, snapshot_id)
        if snapshot is None:
            raise ValueError("Parent snapshot does not exist")
        if horizon <= snapshot.as_of:
            raise ValueError("Simulation horizon must be later than snapshot as_of")
        branch = SimulationBranch(
            branch_id=str(uuid4()),
            snapshot_id=snapshot_id,
            parent_branch_id=parent_branch_id,
            name=name,
            horizon=horizon,
            changes=changes or {},
        )
        session.add(branch)
        await session.flush()
        return branch

    async def add_change(
        self,
        session: AsyncSession,
        *,
        branch_id: str,
        entity_id: str,
        changes: Dict[str, Any],
    ) -> SimulationBranch:
        branch = await session.get(SimulationBranch, branch_id)
        if branch is None:
            raise ValueError("Simulation branch does not exist")
        if branch.status != "DRAFT":
            raise ValueError("Only DRAFT branches can be modified")
        current = dict(branch.changes or {})
        current.setdefault(entity_id, {}).update(changes)
        branch.changes = current
        await session.flush()
        return branch

    @staticmethod
    def calculate_delta(
        baseline: Dict[str, Dict[str, Any]],
        scenario: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        entity_deltas: Dict[str, Dict[str, Any]] = {}
        all_entities = set(baseline) | set(scenario)
        changed = 0
        for entity_id in sorted(all_entities):
            before = baseline.get(entity_id, {})
            after = scenario.get(entity_id, {})
            keys = set(before) | set(after)
            changes = {
                key: {"before": before.get(key), "after": after.get(key)}
                for key in sorted(keys)
                if before.get(key) != after.get(key)
            }
            if changes:
                changed += 1
                entity_deltas[entity_id] = changes
        return {
            "changed_entities": changed,
            "total_entities": len(all_entities),
            "entity_deltas": entity_deltas,
        }
