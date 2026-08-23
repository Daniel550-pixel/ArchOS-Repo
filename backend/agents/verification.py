"""Deterministic verification plus evidence reconciliation for AgentResult."""
from dataclasses import dataclass

from .base import AgentResult, AgentTask, VerificationStatus, RealityLevel
from .evidence import EvidenceAssessment, EvidenceEngine, evidence_engine


@dataclass(frozen=True)
class VerificationReport:
    status: VerificationStatus
    confidence: float
    checks: tuple[str, ...]
    reasons: tuple[str, ...]
    evidence: EvidenceAssessment | None = None


class AgentResultVerifier:
    """Establish a bounded trust state; never upgrade unsupported evidence."""

    def __init__(self, evidence: EvidenceEngine = evidence_engine) -> None:
        self.evidence_engine = evidence

    def verify(self, task: AgentTask, result: AgentResult, corroborating=()) -> VerificationReport:
        checks: list[str] = []
        reasons: list[str] = []
        if result.task_id != task.task_id:
            return VerificationReport(VerificationStatus.REJECTED, 0.0, ("task_identity",), ("Result task_id does not match requested task",))
        checks.append("task_identity")
        if not result.agent_id:
            return VerificationReport(VerificationStatus.REJECTED, 0.0, tuple(checks), ("Result has no agent identity",))
        checks.append("agent_identity")

        confidence = max(0.0, min(1.0, float(result.confidence)))
        if result.status in {"FAILED", "TIMEOUT", "DENIED"}:
            return VerificationReport(VerificationStatus.REJECTED, 0.0, tuple(checks), (f"execution_status:{result.status}",))

        if result.provenance:
            checks.append("provenance")
        else:
            reasons.append("missing_provenance")
        if result.evidence:
            checks.append("evidence")
        else:
            reasons.append("missing_evidence")

        assessment = self.evidence_engine.assess(task, result, corroborating)
        confidence = min(confidence, assessment.score)
        reasons.extend(assessment.reasons)
        if assessment.corroborated:
            checks.append("multi_source_corroboration")

        if result.reality in {RealityLevel.OBSERVED, RealityLevel.INFERRED} and confidence >= 0.8 and result.provenance and result.evidence:
            return VerificationReport(VerificationStatus.VERIFIED, confidence, tuple(checks), tuple(reasons), assessment)
        if confidence > 0.0:
            return VerificationReport(VerificationStatus.PARTIALLY_VERIFIED, confidence, tuple(checks), tuple(reasons), assessment)
        return VerificationReport(VerificationStatus.UNVERIFIED, 0.0, tuple(checks), tuple(reasons), assessment)


agent_result_verifier = AgentResultVerifier()
