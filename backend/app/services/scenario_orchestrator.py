from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.scenario_execution import ScenarioExecutionEngine
from app.services.scenario_planner import ScenarioPlanner
from app.services.scenario_store import ScenarioStore
from app.services.world_model_binding import WorldModelBindingService


class ScenarioOrchestrator:
    """Controlled plan -> World Model binding -> branch -> execution pipeline."""

    def __init__(self) -> None:
        self.planner = ScenarioPlanner()
        self.store = ScenarioStore()
        self.executor = ScenarioExecutionEngine()
        self.binding = WorldModelBindingService()

    async def plan(self, session: AsyncSession, request: str, *, now: datetime) -> dict[str, Any]:
        plan = self.planner.plan(request, now=now)
        candidates = await self.binding.resolve(session, request, as_of=now)
        chosen = self.binding.choose(candidates)
        binding = self.binding.serialize(chosen)
        assumptions = dict(plan.assumptions)
        assumptions["world_model_binding"] = binding
        requires_confirmation = plan.requires_confirmation or binding is None
        confidence = min(plan.confidence, binding["confidence"] if binding else 0.0)
        return {
            "objective": plan.objective,
            "assumptions": assumptions,
            "horizon": plan.horizon,
            "confidence": confidence,
            "requires_confirmation": requires_confirmation,
            "rationale": (
                "World Model binding verified."
                if binding and not plan.requires_confirmation
                else "World Model metric/entity binding requires confirmation."
                if binding
                else "No sufficiently confident World Model entity/metric binding was found."
            ),
            "candidates": [self.binding.serialize(candidate) for candidate in candidates],
        }

    async def execute_plan(
        self,
        session: AsyncSession,
        *,
        snapshot_id: str,
        request: str,
        now: datetime,
        confirm: bool = False,
    ) -> dict[str, Any]:
        planned = await self.plan(session, request, now=now)
        if planned["requires_confirmation"] and not confirm:
            return {
                "status": "CONFIRMATION_REQUIRED",
                "plan": planned,
                "reason": planned["rationale"],
            }

        binding = planned["assumptions"].get("world_model_binding")
        if not binding:
            raise ValueError("Cannot execute without a verified World Model binding")
        current = binding["current_value"]
        if not isinstance(current, (int, float)) or isinstance(current, bool):
            raise ValueError("Bound World Model metric is not numeric; explicit metric transformation is required")

        percentages = planned["assumptions"].get("requested_change_percentages", [])
        if not percentages:
            raise ValueError("Cannot execute without an explicit quantitative assumption")
        percent = float(percentages[-1])
        lowered = request.lower()
        if re.search(r"\b(decrease|decreases|decreased|reduce|reduces|reduced|lower|lowers|cut|cuts)\b", lowered):
            percent = -abs(percent)
        elif re.search(r"\b(increase|increases|increased|raise|raises|raised|grow|grows|growth)\b", lowered):
            percent = abs(percent)

        after = float(current) * (1.0 + percent / 100.0)
        changes = {binding["entity_id"]: {binding["metric"]: after}}
        branch = await self.store.create_branch(
            session,
            snapshot_id=snapshot_id,
            name=planned["objective"][:255],
            horizon=planned["horizon"],
            changes=changes,
        )
        branch.metrics = {
            "planner_confidence": planned["confidence"],
            "assumptions": planned["assumptions"],
            "transformation": {
                "entity_id": binding["entity_id"],
                "metric": binding["metric"],
                "before": current,
                "after": after,
                "change_percent": percent,
            },
        }
        await session.flush()

        report = await self.executor.execute(session, branch_id=branch.branch_id, as_of=now)
        return {
            "status": "COMPLETED",
            "plan": planned,
            "branch_id": branch.branch_id,
            "report": report,
        }
