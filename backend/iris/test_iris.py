from .engine import RealityIntegrityEngine
from .models import IntegrityDomain, IntegritySignal
from .policy import IntegrityDecision, IntegrityPolicy


def test_weighted_integrity_score():
    engine = RealityIntegrityEngine()
    result = engine.measure([
        IntegritySignal(IntegrityDomain.HARDWARE, "secure_boot", 1.0, provenance="hardware:secure_boot"),
        IntegritySignal(IntegrityDomain.NETWORK, "dns", 0.5, provenance="network:dns"),
    ])
    assert result.score == 0.75
    assert result.domain_scores["hardware"] == 1.0
    assert result.domain_scores["network"] == 0.5
    assert result.signal_count == 2


def test_policy_is_explicit_and_deterministic():
    policy = IntegrityPolicy()
    assert policy.decide(0.90) is IntegrityDecision.CONTINUE
    assert policy.decide(0.70) is IntegrityDecision.REVIEW
    assert policy.decide(0.50) is IntegrityDecision.RESTRICT
