from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.scenario_planner import ScenarioPlanner

router = APIRouter(prefix="/api/simulation/planner", tags=["scenario-planner"])
_planner = ScenarioPlanner()


class PlanRequest(BaseModel):
    request: str


@router.post("/plan")
async def plan(request: PlanRequest):
    try:
        return _planner.plan(
            request.request,
            now=datetime.now(timezone.utc).replace(tzinfo=None),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
