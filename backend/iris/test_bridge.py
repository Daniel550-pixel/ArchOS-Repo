from .engine import RealityIntegrityEngine
from .jarvis_bridge import trust_context
from .models import IntegrityDomain, IntegritySignal


def test_trust_context_contains_score_and_policy_decision():
    snapshot = RealityIntegrityEngine().measure([
        IntegritySignal(IntegrityDomain.DATA, "baseline", 0.9, provenance="data:baseline"),
    ])
    context = trust_context(snapshot)
    assert context["iris_score"] == 0.9
    assert context["integrity_decision"] == "CONTINUE"
