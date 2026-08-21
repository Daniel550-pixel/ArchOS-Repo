from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.scenario_execution import ScenarioExecutionEngine

router = APIRouter(prefix="/api/simulation/execution", tags=["simulation-execution"])
_engine = ScenarioExecutionEngine()


class ExecuteRequest(BaseModel):
    as_of: datetime
    max_depth: int = Field(default=4, ge=1, le=10)
    max_nodes: int = Field(default=500, ge=1, le=5000)


@router.post("/{branch_id}")
async def execute(branch_id: str, request: ExecuteRequest, session: AsyncSession = Depends(get_db)):
    try:
        report = await _engine.execute(
            session,
            branch_id=branch_id,
            as_of=request.as_of,
            max_depth=request.max_depth,
            max_nodes=request.max_nodes,
        )
        await session.commit()
        return report
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
