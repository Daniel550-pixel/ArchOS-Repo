"""Stable data contracts for IRIS integrity measurements."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime, timezone

class IntegrityDomain(str, Enum):
    HARDWARE = "hardware"
    OPERATING_SYSTEM = "operating_system"
    IDENTITY = "identity"
    NETWORK = "network"
    DATA = "data"
    REALITY = "reality"
    AI_SECURITY = "ai_security"

@dataclass(frozen=True)
class IntegritySignal:
    domain: IntegrityDomain
    name: str
    score: float
    confidence: float = 1.0
    observed: bool = True
    provenance: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def __post_init__(self) -> None:
        if not 0.0 <= self.score <= 1.0:
            raise ValueError("score must be between 0 and 1")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        if not self.name.strip():
            raise ValueError("signal name cannot be empty")

@dataclass(frozen=True)
class IntegritySnapshot:
    score: float
    domain_scores: Dict[str, float]
    signal_count: int
    confidence: float
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    evidence: tuple = ()
    status: str = "MEASURED"
    previous_score: Optional[float] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "domain_scores": dict(self.domain_scores),
            "signal_count": self.signal_count,
            "confidence": self.confidence,
            "generated_at": self.generated_at,
            "evidence": list(self.evidence),
            "status": self.status,
            "previous_score": self.previous_score,
        }
