"""Deterministic aggregation for normalized IRIS observations."""
from .models import IntegritySnapshot

class RealityIntegrityEngine:
    def __init__(self, weights=None):
        self.weights = weights or {}
        self.previous = None

    def measure(self, signals):
        signals = list(signals)
        groups = {}
        for signal in signals:
            key = signal.domain.value
            groups.setdefault(key, []).append(signal)

        domain_scores = {}
        for key, items in groups.items():
            total = sum(item.confidence for item in items)
            domain_scores[key] = round(sum(item.score * item.confidence for item in items) / total, 4) if total else 0.0

        weighted = 0.0
        total_weight = 0.0
        for key, score in domain_scores.items():
            weight = max(0.0, self.weights.get(key, 1.0))
            weighted += score * weight
            total_weight += weight
        overall = round(weighted / total_weight, 4) if total_weight else 0.0
        confidence = round(sum(item.confidence for item in signals) / len(signals), 4) if signals else 0.0
        snapshot = IntegritySnapshot(score=overall, domain_scores=domain_scores, signal_count=len(signals), confidence=confidence, evidence=tuple(item.provenance for item in signals if item.provenance), previous_score=self.previous, status="MEASURED" if signals else "NO_SIGNAL")
        self.previous = overall
        return snapshot
