from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.causal_graph import CausalGraphService
from app.services.scenario_store import ScenarioStore
from app.services.scenario_verifier import ScenarioVerifier


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ScenarioExecutionEngine:
    """Executes a persisted scenario without mutating authoritative World Model state."""

    def __init__(self) -> None:
        self.store = ScenarioStore()
        self.graph = CausalGraphService()
        self.verifier = ScenarioVerifier()

    async def execute(
        self,
        session: AsyncSession,
        *,
        branch_id: str,
        as_of: datetime,
        max_depth: int = 4,
        max_nodes: int = 500,
    ) -> Dict[str, Any]:
        from app.models.simulation import SimulationBranch, SimulationSnapshot

        branch = await session.get(SimulationBranch, branch_id)
        if branch is None:
            raise ValueError("Simulation branch does not exist")
        snapshot = await session.get(SimulationSnapshot, branch.snapshot_id)
        if snapshot is None:
            raise ValueError("Parent snapshot does not exist")
        if branch.status == "EXECUTING":
            raise ValueError("Simulation branch is already executing")

        baseline = dict(snapshot.state or {})
        scenario = {entity_id: dict(values) for entity_id, values in baseline.items()}
        for entity_id, changes in (branch.changes or {}).items():
            scenario.setdefault(entity_id, {}).update(changes)

        delta = self.store.calculate_delta(baseline, scenario)
        direct_deltas: dict[str, float] = {}
        for entity_id, changes in delta["entity_deltas"].items():
            for metric, pair in changes.items():
                before, after = pair["before"], pair["after"]
                if isinstance(before, (int, float)) and isinstance(after, (int, float)):
                    direct_deltas[f"{entity_id}.{metric}"] = float(after) - float(before)

        branch.status = "EXECUTING"
        await session.flush()
        try:
            propagation = await self.graph.propagate(
                session,
                direct_deltas,
                as_of=as_of,
                max_depth=max_depth,
                max_nodes=max_nodes,
            )
            report = {
                "branch_id": branch.branch_id,
                "snapshot_id": snapshot.snapshot_id,
                "snapshot_digest": snapshot.digest,
                "executed_at": utc_now().isoformat(),
                "horizon": branch.horizon.isoformat(),
                "status": "COMPLETED",
                "baseline_vs_scenario": delta,
                "causal_propagation": propagation,
                "confidence": propagation["confidence"],
                "risk_score": self._risk_score(propagation),
                "authoritative_world_model_mutated": False,
            }
            verification = self.verifier.verify(report)
            report["verification"] = {
                "status": verification.status,
                "score": verification.score,
                "checks": verification.checks,
                "violations": verification.violations,
            }
            if verification.status != "VERIFIED":
                branch.status = "REJECTED"
                branch.confidence = verification.score
                await session.flush()
                raise ValueError(
                    "Scenario verification failed: " + ", ".join(verification.violations)
                )

            branch.status = "COMPLETED"
            branch.confidence = report["confidence"]
            branch.metrics = {
                "changed_entities": delta["changed_entities"],
                "risk_score": report["risk_score"],
                "nodes_visited": propagation["nodes_visited"],
                "verification_score": verification.score,
            }
            await session.flush()
            return report
        except Exception:
            if branch.status == "EXECUTING":
                branch.status = "FAILED"
                await session.flush()
            raise

    @staticmethod
    def _risk_score(propagation: Dict[str, Any]) -> float:
        effects = propagation.get("propagated_effects", {})
        magnitude = sum(abs(float(value)) for value in effects.values())
        confidence = float(propagation.get("confidence", 0.0))
        return round(min(1.0, min(1.0, magnitude / 100.0) * 0.7 + (1.0 - confidence) * 0.3), 4)
