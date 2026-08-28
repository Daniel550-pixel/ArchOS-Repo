"""Typed contracts for governed ArchOS multi-model reasoning."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class CanonicalPosition(str, Enum):
    AFFIRM = "affirm"
    NEGATE = "negate"
    UNCERTAIN = "uncertain"
    ABSTAIN = "abstain"


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
    position: CanonicalPosition | None
    rationale: str = ""
    confidence: float = 0.0
    evidence: tuple[EvidenceRef, ...] = ()
    status: LaneStatus = LaneStatus.SUCCESS
    model: str | None = None
    error: str | None = None
    reliability_score: float | None = None

    @property
    def successful(self) -> bool:
        return self.status is LaneStatus.SUCCESS and self.position is not None


@dataclass(frozen=True)
class Conflict:
    claim_id: str
    lanes: tuple[str, ...]
    positions: tuple[CanonicalPosition, ...]
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
    proposed_position: CanonicalPosition | None
    selected_position: CanonicalPosition | None
    agreement_score: float
    conflicts: tuple[Conflict, ...] = ()
    resolution_reason: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return _jsonable(asdict(self))


@dataclass(frozen=True)
class VerificationArtifact:
    task_id: str
    decision_id: str
    incoming_panel_state: PanelState
    verdict: VerificationVerdict
    verified_position: CanonicalPosition | None
    confidence: float
    evidence: tuple[EvidenceRef, ...] = ()
    discrepancies: tuple[str, ...] = ()
    verifier: str = "archos-verification"
    verification_method: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return _jsonable(asdict(self))


def _jsonable(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, tuple):
        return [_jsonable(item) for item in value]
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    return value


def normalize_position(position: Any) -> CanonicalPosition | None:
    if isinstance(position, CanonicalPosition):
        return position
    if position is None:
        return None
    value = str(position).strip().lower()
    return {
        "yes": CanonicalPosition.AFFIRM,
        "true": CanonicalPosition.AFFIRM,
        "affirm": CanonicalPosition.AFFIRM,
        "no": CanonicalPosition.NEGATE,
        "false": CanonicalPosition.NEGATE,
        "negate": CanonicalPosition.NEGATE,
        "uncertain": CanonicalPosition.UNCERTAIN,
        "unknown": CanonicalPosition.UNCERTAIN,
        "abstain": CanonicalPosition.ABSTAIN,
    }.get(value)
