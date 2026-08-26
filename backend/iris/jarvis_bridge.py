"""Small adapter that keeps IRIS measurement separate from orchestration."""
from .models import IntegritySnapshot
from .policy import IntegrityPolicy


def trust_context(snapshot: IntegritySnapshot, policy: IntegrityPolicy | None = None):
    policy = policy or IntegrityPolicy()
    decision = policy.decide(snapshot.score)
    return {
        "iris_score": snapshot.score,
        "iris_confidence": snapshot.confidence,
        "iris_status": snapshot.status,
        "integrity_decision": decision.value,
        "domain_scores": dict(snapshot.domain_scores),
        "signal_count": snapshot.signal_count,
        "previous_score": snapshot.previous_score,
    }
