from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.scenario_execution import ScenarioExecutionEngine
from app.services.scenario_planner import ScenarioPlanner
from app.services.scenario_store import ScenarioStore


class ScenarioOrchestrator:
    """Controlled plan -> snapshot -> branch -> execution pipeline."""

    def __init__(self) -> None:
        self.planner = ScenarioPlanner()
        self.store = ScenarioStore()
        self.executor = ScenarioExecutionEngine()

    async def plan(self, request: str, *, now: datetime) -> Any:
        return self.planner.plan(request, now=now)

    async def execute_plan(
        self,
        session: AsyncSession,
        *,
        snapshot_id: str,
        request: str,
        now: datetime,
        confirm: bool = False,
    ) -> dict[str, Any]:
        plan = self.planner.plan(request, now=now)
        if plan.requires_confirmation and not confirm:
            return {
                "status": "CONFIRMATION_REQUIRED",
                "plan": plan,
                "reason": plan.rationale,
            }

        branch = await self.store.create_branch(
            session,
            snapshot_id=snapshot_id,
            name=plan.objective[:255],
            horizon=plan.horizon,
            changes={},
        )

        # Quantitative assumptions are deliberately kept explicit. The planner
        # never invents an entity/metric mapping from free text.
        branch.metrics = {
            "planner_confidence": plan.confidence,
            "assumptions": plan.assumptions,
        }
        await session.flush()

        report = await self.executor.execute(
            session,
            branch_id=branch.branch_id,
            as_of=now,
        )
        return {
            "status": "COMPLETED",
            "plan": plan,
            "branch_id": branch.branch_id,
            "report": report,
        }
