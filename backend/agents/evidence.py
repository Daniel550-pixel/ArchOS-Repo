"""Evidence and provenance reconciliation for agent results."""
from dataclasses import dataclass
from typing import Iterable

from .base import AgentResult, AgentTask, RealityLevel


@dataclass(frozen=True)
class EvidenceRecord:
    source: str
    claim: str
    confidence: float
    reality: RealityLevel


@dataclass(frozen=True)
class EvidenceAssessment:
    score: float
    corroborated: bool
    sources: tuple[str, ...]
    reasons: tuple[str, ...]


class EvidenceEngine:
    """Reconcile result evidence without inventing evidence."""

    def assess(self, task: AgentTask, result: AgentResult, corroborating: Iterable[EvidenceRecord] = ()) -> EvidenceAssessment:
        reasons: list[str] = []
        sources: list[str] = []
        score = max(0.0, min(1.0, float(result.confidence)))

        if result.provenance:
            sources.append(result.provenance)
        else:
            reasons.append("missing_primary_provenance")
            score *= 0.65

        if not result.evidence:
            reasons.append("missing_primary_evidence")
            score *= 0.65

        records = [r for r in corroborating if r.source and r.claim]
        unique_sources = {r.source for r in records}
        if records:
            sources.extend(sorted(unique_sources))
            compatible = [r for r in records if r.reality == result.reality]
            if compatible:
                corroboration = sum(max(0.0, min(1.0, r.confidence)) for r in compatible) / len(compatible)
                score = min(1.0, score * 0.7 + corroboration * 0.3)
            else:
                reasons.append("corroborating_reality_mismatch")
                score *= 0.8

        corroborated = len(unique_sources) >= 2
        if corroborated:
            reasons.append("multi_source_corroboration")

        return EvidenceAssessment(round(score, 4), corroborated, tuple(dict.fromkeys(sources)), tuple(reasons))


evidence_engine = EvidenceEngine()
