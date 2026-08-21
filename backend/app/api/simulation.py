from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.simulation_engine import SimulationEngine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])
_engine = SimulationEngine()

# Ephemeral branch registry. Branches are derived from immutable snapshots and
# must never become authoritative World Model state.
_snapshots: Dict[str, Any] = {}
_branches: Dict[str, Any] = {}


class BranchRequest(BaseModel):
    snapshot_id: str
    horizon: datetime
    changes: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class ChangeRequest(BaseModel):
    entity_id: str
    changes: Dict[str, Any]


async def get_db() -> AsyncSession:
    from app.core.database import get_db_session
    async for session in get_db_session():
        yield session


@router.post("/snapshots")
async def create_snapshot(
    as_of: Optional[datetime] = None,
    session: AsyncSession = Depends(get_db),
):
    snapshot = await _engine.create_snapshot(session, as_of=as_of)
    _snapshots[snapshot.snapshot_id] = snapshot
    return snapshot


@router.post("/branches")
async def create_branch(
    request: BranchRequest,
):
    snapshot = _snapshots.get(request.snapshot_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    branch = _engine.create_branch(
        snapshot,
        horizon=request.horizon,
        changes=request.changes,
    )
    _branches[branch.branch_id] = branch
    return branch


@router.post("/branches/{branch_id}/changes")
async def apply_change(branch_id: str, request: ChangeRequest):
    branch = _branches.get(branch_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Simulation branch not found")
    _engine.apply_change(branch, entity_id=request.entity_id, changes=request.changes)
    return branch


@router.get("/branches/{branch_id}/state")
async def materialize_branch(branch_id: str):
    branch = _branches.get(branch_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Simulation branch not found")
    snapshot = _snapshots.get(branch.snapshot_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Parent snapshot not found")
    return {
        "branch_id": branch.branch_id,
        "snapshot_id": snapshot.snapshot_id,
        "snapshot_digest": snapshot.digest,
        "horizon": branch.horizon,
        "state": _engine.materialize(snapshot, branch),
    }
