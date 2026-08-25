"""ArchOS-native Financial Intelligence Engine."""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from math import isfinite
from statistics import mean
from typing import Any, Iterable

@dataclass(frozen=True)
class FinancialObservation:
    symbol: str
    price: float
    volatility: float = 0.0
    volume: float = 0.0
    trend: str = "UNKNOWN"
    source: str = "unknown"
    observed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass(frozen=True)
class FinancialAssessment:
    symbol: str
    signal: str
    confidence: float
    risk: float
    score: float
    rationale: tuple[str, ...]
    provenance: tuple[str, ...]
    reality: str = "OBSERVED"
    def to_dict(self) -> dict[str, Any]: return asdict(self)

def _bounded(value: float) -> float: return max(0.0, min(1.0, value))

def assess_market(observations: Iterable[FinancialObservation]) -> list[FinancialAssessment]:
    assessments: list[FinancialAssessment] = []
    for item in observations:
        if not item.symbol or not all(isfinite(v) for v in (item.price, item.volatility, item.volume)): continue
        trend = item.trend.upper()
        trend_score = {"UP": 0.7, "DOWN": -0.7, "SIDEWAYS": 0.0}.get(trend, 0.0)
        volatility_penalty = _bounded(item.volatility)
        score = max(-1.0, min(1.0, trend_score * (1.0 - 0.5 * volatility_penalty)))
        signal = "LONG_BIAS" if score > 0.2 else "SHORT_BIAS" if score < -0.2 else "HOLD"
        confidence = _bounded(0.5 + abs(score) * 0.45 - volatility_penalty * 0.15)
        risk = _bounded(0.2 + volatility_penalty * 0.7)
        assessments.append(FinancialAssessment(item.symbol, signal, confidence, risk, score, (f"trend={trend}", f"volatility={item.volatility:.4f}"), (item.source,)))
    return assessments

def aggregate_confidence(assessments: Iterable[FinancialAssessment]) -> float:
    values = [a.confidence for a in assessments]
    return round(mean(values), 4) if values else 0.0
