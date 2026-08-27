"""Typed consensus artifacts for governed multi-model reasoning.

Consensus is deliberately a reducer of reasoning variance, not a correctness
oracle. Verification must consume the artifact before consequential execution.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone


class Agreement(str, Enum):
    UNANIMOUS = "UNANIMOUS"
    MAJORITY = "MAJORITY"
    SPLIT = "SPLIT"
    ABSTAINED = "ABSTAINED"


class ConflictType(str, Enum):
    FACTUAL = "FACTUAL"
    TEMPORAL = "TEMPORAL"
    CAUSAL = "CAUSAL"
    NUMERICAL = "NUMERICAL"
    INTERPRETIVE = "INTERPRETIVE"
    PREDICTIVE = "PREDICTIVE"
    MISSING_EVIDENCE = "MISSING_EVIDENCE"
    TOOL_DISAGREEMENT = "TOOL_DISAGREEMENT"


class Resolution(str, Enum):
    CONSENSUS = "CONSENSUS"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"
    ABSTAIN = "ABSTAIN"
    HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED"


@dataclass(frozen=True)
class EvidenceRef:
    source: str
    claim: str
    reality: str = "INFERRED"
    strength: float = 0.0


@dataclass(frozen=True)
class LaneAssessment:
    lane_id: str
    status: str
    position: str
    confidence: float
    evidence_density: float = 0.0
    reliability_score: float = 1.0
    model: Optional[str] = None
    error: Optional[str] = None


@dataclass(frozen=True)
class Conflict:
    claim_id: str
    lane_a: str
    lane_b: str
    position_a: str
    position_b: str
    conflict_type: ConflictType
    materiality: float
    confidence_delta: float
    evidence_a: List[EvidenceRef] = field(default_factory=list)
    evidence_b: List[EvidenceRef] = field(default_factory=list)
    resolution_status: str = "OPEN"


@dataclass(frozen=True)
class Claim:
    claim_id: str
    statement: str
    agreement: Agreement
    confidence: float
    lane_positions: List[LaneAssessment] = field(default_factory=list)
    evidence: List[EvidenceRef] = field(default_factory=list)
    conflicts: List[Conflict] = field(default_factory=list)


@dataclass(frozen=True)
class ConsensusArtifact:
    task_id: str
    decision_id: str
    claims: List[Claim]
    lanes: List[LaneAssessment]
    agreement_score: float
    conflict_score: float
    resolution: Resolution
    resolution_reason: str
    provenance: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return _jsonable(asdict(self))


def _jsonable(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    return value


def build_consensus_artifact(
    *,
    task_id: str,
    decision_id: str,
    lane_results: List[LaneAssessment],
    claim: str,
    evidence: Optional[List[EvidenceRef]] = None,
    conflicts: Optional[List[Conflict]] = None,
    high_impact: bool = False,
) -> ConsensusArtifact:
    """Build a deterministic first-pass consensus artifact.

    The function never treats model agreement as verification. External
    evidence and the verification agent remain authoritative downstream.
    """
    evidence = evidence or []
    conflicts = conflicts or []
    successful = [lane for lane in lane_results if lane.status == "SUCCESS"]

    positions = {lane.position.strip().lower() for lane in successful if lane.position.strip()}
    if not successful:
        agreement = Agreement.ABSTAINED
    elif len(positions) <= 1:
        agreement = Agreement.UNANIMOUS
    elif len(successful) >= 3:
        agreement = Agreement.MAJORITY if len(positions) == 2 else Agreement.SPLIT
    else:
        agreement = Agreement.SPLIT

    agreement_score = 0.0 if not successful else max(0.0, min(1.0, 1.0 - (len(positions) - 1) / max(1, len(successful))))
    conflict_score = max(0.0, min(1.0, sum(c.materiality for c in conflicts) / max(1, len(conflicts)))) if conflicts else 0.0

    if not successful:
        resolution = Resolution.ABSTAIN
        reason = "No reasoning lane produced a successful result."
    elif high_impact and (agreement != Agreement.UNANIMOUS or not evidence):
        resolution = Resolution.HUMAN_REVIEW_REQUIRED
        reason = "High-impact task lacks unanimous, externally grounded consensus."
    elif conflicts or agreement == Agreement.SPLIT:
        resolution = Resolution.VERIFICATION_REQUIRED
        reason = "Material disagreement requires independent verification."
    else:
        resolution = Resolution.CONSENSUS
        reason = "Reasoning lanes agree; independent verification remains required before action."

    claim_obj = Claim(
        claim_id=f"claim-{decision_id}",
        statement=claim,
        agreement=agreement,
        confidence=max((lane.confidence for lane in successful), default=0.0),
        lane_positions=lane_results,
        evidence=evidence,
        conflicts=conflicts,
    )
    return ConsensusArtifact(
        task_id=task_id,
        decision_id=decision_id,
        claims=[claim_obj],
        lanes=lane_results,
        agreement_score=agreement_score,
        conflict_score=conflict_score,
        resolution=resolution,
        resolution_reason=reason,
        provenance=[lane.lane_id for lane in lane_results],
    )
