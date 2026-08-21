from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.scenario_orchestrator import ScenarioOrchestrator

router = APIRouter(prefix="/api/simulation/orchestrator", tags=["scenario-orchestrator"])
_orchestrator = ScenarioOrchestrator()


async def get_db() -> AsyncSession:
    from app.core.database import get_db_session
    async for session in get_db_session():
        yield session


class PlanRequest(BaseModel):
    request: str


class ExecutePlanRequest(BaseModel):
    snapshot_id: str
    request: str
    confirm: bool = False


@router.post("/plan")
async def plan(request: PlanRequest):
    try:
        result = await _orchestrator.plan(
            request.request,
            now=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/execute")
async def execute_plan(
    request: ExecutePlanRequest,
    session: AsyncSession = Depends(get_db),
):
    try:
        result = await _orchestrator.execute_plan(
            session,
            snapshot_id=request.snapshot_id,
            request=request.request,
            now=datetime.now(timezone.utc).replace(tzinfo=None),
            confirm=request.confirm,
        )
        await session.commit()
        return result
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
