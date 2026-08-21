from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class VerificationResult:
    status: str
    score: float
    checks: Dict[str, bool]
    violations: list[str]


class ScenarioVerifier:
    """Independent consistency gate for simulation outputs.

    Verification is read-only: it never changes the World Model or simulation state.
    """

    def verify(self, report: Dict[str, Any]) -> VerificationResult:
        checks = {
            "report_completed": report.get("status") == "COMPLETED",
            "world_model_immutable": report.get("authoritative_world_model_mutated") is False,
            "snapshot_traceable": bool(report.get("snapshot_id")) and bool(report.get("snapshot_digest")),
            "propagation_present": isinstance(report.get("causal_propagation"), dict),
            "confidence_bounded": self._bounded(report.get("confidence")),
            "risk_bounded": self._bounded(report.get("risk_score")),
            "delta_consistent": self._delta_is_consistent(report.get("baseline_vs_scenario")),
        }
        violations = [name for name, passed in checks.items() if not passed]
        score = round(sum(checks.values()) / len(checks), 4)
        status = "VERIFIED" if not violations else "REJECTED"
        return VerificationResult(status=status, score=score, checks=checks, violations=violations)

    @staticmethod
    def _bounded(value: Any) -> bool:
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return False
        return 0.0 <= numeric <= 1.0

    @staticmethod
    def _delta_is_consistent(delta: Any) -> bool:
        if not isinstance(delta, dict):
            return False
        changed = delta.get("changed_entities")
        entity_deltas = delta.get("entity_deltas")
        return isinstance(changed, int) and changed >= 0 and isinstance(entity_deltas, dict)
