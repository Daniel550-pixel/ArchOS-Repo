"""Deterministic verification boundary for AgentResult objects."""
from dataclasses import dataclass

from .base import AgentResult, AgentTask, VerificationStatus, RealityLevel


@dataclass(frozen=True)
class VerificationReport:
    status: VerificationStatus
    confidence: float
    checks: tuple[str, ...]
    reasons: tuple[str, ...]


class AgentResultVerifier:
    """Apply structural and evidence checks before an agent result is trusted."""

    def verify(self, task: AgentTask, result: AgentResult) -> VerificationReport:
        checks: list[str] = []
        reasons: list[str] = []

        if result.task_id != task.task_id:
            return VerificationReport(VerificationStatus.REJECTED, 0.0, ("task_identity",), ("Result task_id does not match requested task",))
        checks.append("task_identity")

        if result.agent_id == "":
            return VerificationReport(VerificationStatus.REJECTED, 0.0, tuple(checks), ("Result has no agent identity",))
        checks.append("agent_identity")

        confidence = max(0.0, min(1.0, float(result.confidence)))
        if result.status in {"FAILED", "TIMEOUT", "DENIED"}:
            reasons.append(f"execution_status:{result.status}")
            return VerificationReport(VerificationStatus.REJECTED, 0.0, tuple(checks), tuple(reasons))

        if result.provenance:
            checks.append("provenance")
        else:
            reasons.append("missing_provenance")

        if result.evidence:
            checks.append("evidence")
        else:
            reasons.append("missing_evidence")

        if result.reality in {RealityLevel.OBSERVED, RealityLevel.INFERRED} and confidence >= 0.8 and result.provenance and result.evidence:
            return VerificationReport(VerificationStatus.VERIFIED, confidence, tuple(checks), tuple(reasons))

        if confidence > 0.0:
            return VerificationReport(VerificationStatus.PARTIALLY_VERIFIED, confidence, tuple(checks), tuple(reasons))

        return VerificationReport(VerificationStatus.UNVERIFIED, 0.0, tuple(checks), tuple(reasons))


agent_result_verifier = AgentResultVerifier()
