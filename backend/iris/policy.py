"""Policy boundary for IRIS-derived decisions."""
from dataclasses import dataclass
from enum import Enum

class IntegrityDecision(str, Enum):
    CONTINUE = "CONTINUE"
    REVIEW = "REVIEW"
    RESTRICT = "RESTRICT"

@dataclass(frozen=True)
class IntegrityPolicy:
    review_below: float = 0.85
    restrict_below: float = 0.60

    def decide(self, score: float) -> IntegrityDecision:
        if score < self.restrict_below:
            return IntegrityDecision.RESTRICT
        if score < self.review_below:
            return IntegrityDecision.REVIEW
        return IntegrityDecision.CONTINUE
