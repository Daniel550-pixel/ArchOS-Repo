from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass(frozen=True)
class CausalRule:
    source: str
    target: str
    coefficient: float
    confidence: float
    rationale: str


class ScenarioIntelligence:
    """Deterministic propagation layer; never mutates authoritative World Model state."""

    def __init__(self, rules: List[CausalRule] | None = None) -> None:
        self.rules = rules or []

    def propagate(
        self,
        baseline: Dict[str, Dict[str, Any]],
        scenario: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        deltas: Dict[str, float] = {}
        explanations: List[Dict[str, Any]] = []

        for entity_id, values in scenario.items():
            before = baseline.get(entity_id, {})
            for metric, after_value in values.items():
                before_value = before.get(metric)
                if isinstance(after_value, (int, float)) and isinstance(before_value, (int, float)):
                    deltas[f"{entity_id}.{metric}"] = float(after_value) - float(before_value)

        propagated: Dict[str, float] = {}
        rule_confidences: List[float] = []
        for rule in self.rules:
            source_delta = deltas.get(rule.source)
            if source_delta is None:
                continue
            effect = source_delta * rule.coefficient
            propagated[rule.target] = propagated.get(rule.target, 0.0) + effect
            rule_confidences.append(max(0.0, min(1.0, rule.confidence)))
            explanations.append({
                "source": rule.source,
                "target": rule.target,
                "source_delta": source_delta,
                "coefficient": rule.coefficient,
                "effect": effect,
                "confidence": rule.confidence,
                "rationale": rule.rationale,
            })

        confidence = sum(rule_confidences) / len(rule_confidences) if rule_confidences else 0.0
        risk = self._risk_score(propagated, confidence)
        return {
            "direct_deltas": deltas,
            "propagated_effects": propagated,
            "explanations": explanations,
            "confidence": confidence,
            "risk_score": risk,
        }

    @staticmethod
    def _risk_score(effects: Dict[str, float], confidence: float) -> float:
        magnitude = sum(abs(value) for value in effects.values())
        normalized_magnitude = min(1.0, magnitude / 100.0)
        uncertainty = 1.0 - confidence
        return round(min(1.0, normalized_magnitude * 0.7 + uncertainty * 0.3), 4)
