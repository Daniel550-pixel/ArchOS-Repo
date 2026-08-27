"""Typed contracts for ArchOS multi-lane reasoning and verification.

The contracts deliberately separate a lane's canonical decision from its
free-form rationale. Consensus operates on canonical positions; verification
operates on claims and evidence. Models never receive execution authority.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping


class LaneStatus(str, Enum):
    SUCCESS = "success"
    TIMEOUT = "timeout"
    ERROR = "error"
    ABSTAINED = "abstained"


class PanelState(str, Enum):
    FULL = "full"
    DEGRADED = "degraded"
    INSUFFICIENT = "insufficient"


class AgreementState(str, Enum):
    UNANIMOUS = "unanimous"
    MAJORITY = "majority"
    SPLIT = "split"
    ABSTAINED = "abstained"


class ResolutionState(str, Enum):
    CONSENSUS = "consensus"
    VERIFICATION_REQUIRED = "verification_required"
    ABSTAIN = "abstain"
    HUMAN_REVIEW_REQUIRED = "human_review_required"


class VerificationVerdict(str, Enum):
    VERIFIED = "verified"
    PARTIALLY_VERIFIED = "partially_verified"
    REFUTED = "refuted"
    INCONCLUSIVE = "inconclusive"
    UNVERIFIABLE = "unverifiable"


class ConflictType(str, Enum):
    POSITION = "position"
    EVIDENCE = "evidence"
    TOOL = "tool"
    TEMPORAL = "temporal"
    NUMERICAL = "numerical"
    CAUSAL = "causal"
    INTERPRETIVE = "interpretive"
    PREDICTIVE = "predictive"
    MISSING_EVIDENCE = "missing_evidence"


@dataclass(frozen=True)
class EvidenceRef:
    source: str
    claim: str
    strength: float = 0.0
    reality_grounded: bool = False


@dataclass(frozen=True)
class LaneResult:
    lane_id: str
    position: str | None
    rationale: str = ""
    confidence: float = 0.0
    evidence: tuple[EvidenceRef, ...] = ()
    status: LaneStatus = LaneStatus.SUCCESS
    model: str | None = None
    error: str | None = None
    reliability_score: float | None = None

    @property
    def successful(self) -> bool:
        return self.status is LaneStatus.SUCCESS and bool(self.position)


@dataclass(frozen=True)
class Conflict:
    claim_id: str
    lanes: tuple[str, ...]
    positions: tuple[str, ...]
    conflict_type: ConflictType
    materiality: float
    reason: str = ""


@dataclass(frozen=True)
class ConsensusArtifact:
    task_id: str
    decision_id: str
    lanes: tuple[LaneResult, ...]
    panel_state: PanelState
    agreement: AgreementState
    resolution: ResolutionState
    selected_position: str | None
    agreement_score: float
    conflicts: tuple[Conflict, ...] = ()
    resolution_reason: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class VerificationArtifact:
    task_id: str
    decision_id: str
    verdict: VerificationVerdict
    verified_position: str | None
    confidence: float
    evidence: tuple[EvidenceRef, ...] = ()
    discrepancies: tuple[str, ...] = ()
    verifier: str = "archos-verification"
    verification_method: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_position(position: Any) -> str | None:
    """Normalize only the canonical position field; never parse rationale."""
    if position is None:
        return None
    value = str(position).strip().lower().replace("-", "_").replace(" ", "_")
    return value or None
