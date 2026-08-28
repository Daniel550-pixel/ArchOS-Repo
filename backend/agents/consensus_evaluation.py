"""Small deterministic evaluation harness for consensus behavior.

This is intentionally model-agnostic. It evaluates supplied LaneResult objects
so future model changes can be compared against the same metrics.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .consensus_contracts import LaneResult
from .consensus_engine import build_consensus


@dataclass(frozen=True)
class ConsensusMetrics:
    cases: int
    unanimous_rate: float
    majority_rate: float
    false_split_rate: float
    abstain_rate: float


def evaluate(cases: Iterable[tuple[str, str, tuple[LaneResult, ...]]]) -> ConsensusMetrics:
    rows = list(cases)
    if not rows:
        return ConsensusMetrics(0, 0.0, 0.0, 0.0, 0.0)

    unanimous = majority = false_split = abstain = 0
    for task_id, expected_position, lanes in rows:
        artifact = build_consensus(task_id, f"eval:{task_id}", lanes)
        if artifact.agreement.value == "unanimous":
            unanimous += 1
        elif artifact.agreement.value == "majority":
            majority += 1
        if artifact.agreement.value == "split" and artifact.selected_position == expected_position:
            false_split += 1
        if artifact.agreement.value == "abstained":
            abstain += 1

    n = len(rows)
    return ConsensusMetrics(
        cases=n,
        unanimous_rate=unanimous / n,
        majority_rate=majority / n,
        false_split_rate=false_split / n,
        abstain_rate=abstain / n,
    )
