"""Deterministic, failure-tolerant consensus engine for ArchOS."""

from __future__ import annotations

from collections import Counter
from typing import Iterable

from .consensus_contracts import (
    AgreementState,
    Conflict,
    ConflictType,
    ConsensusArtifact,
    LaneResult,
    LaneStatus,
    PanelState,
    ResolutionState,
    normalize_position,
)


def build_consensus(
    task_id: str,
    decision_id: str,
    lanes: Iterable[LaneResult],
    *,
    high_impact: bool = False,
) -> ConsensusArtifact:
    """Build consensus without ever treating missing lanes as votes."""
    lane_results = tuple(lanes)
    successful = tuple(l for l in lane_results if l.successful)
    expected = len(lane_results)

    if expected == 0:
        panel = PanelState.INSUFFICIENT
    elif len(successful) == expected:
        panel = PanelState.FULL
    elif len(successful) >= 2:
        panel = PanelState.DEGRADED
    else:
        panel = PanelState.INSUFFICIENT

    positions = tuple(normalize_position(l.position) for l in successful)
    positions = tuple(p for p in positions if p is not None)
    counts = Counter(positions)
    unique = len(counts)

    if not positions:
        agreement = AgreementState.ABSTAINED
        selected = None
        resolution = ResolutionState.ABSTAIN
        reason = "No successful lane produced a canonical position."
    else:
        selected, votes = counts.most_common(1)[0]
        agreement_score = votes / len(positions)
        if unique == 1:
            agreement = AgreementState.UNANIMOUS
        elif len(positions) >= 3 and votes > len(positions) / 2:
            agreement = AgreementState.MAJORITY
        else:
            agreement = AgreementState.SPLIT

        if high_impact and (agreement is not AgreementState.UNANIMOUS or not any(l.evidence for l in successful)):
            resolution = ResolutionState.HUMAN_REVIEW_REQUIRED
            reason = "High-impact decision lacks unanimous, evidence-backed agreement."
        elif panel is PanelState.INSUFFICIENT:
            resolution = ResolutionState.ABSTAIN
            reason = "Insufficient successful reasoning lanes."
        elif agreement is AgreementState.SPLIT:
            resolution = ResolutionState.VERIFICATION_REQUIRED
            reason = "Reasoning lanes disagree on the canonical position."
        elif not any(l.evidence for l in successful):
            resolution = ResolutionState.VERIFICATION_REQUIRED
            reason = "Agreement exists but no lane supplied evidence."
        else:
            resolution = ResolutionState.CONSENSUS
            reason = "Successful lanes agree on a canonical position with evidence."

    agreement_score = (max(counts.values()) / len(positions)) if positions else 0.0

    conflicts: list[Conflict] = []
    if unique > 1:
        grouped: dict[str, list[str]] = {}
        for lane in successful:
            p = normalize_position(lane.position)
            if p:
                grouped.setdefault(p, []).append(lane.lane_id)
        groups = list(grouped.items())
        for i, (position_a, lanes_a) in enumerate(groups):
            for position_b, lanes_b in groups[i + 1:]:
                conflicts.append(
                    Conflict(
                        claim_id=task_id,
                        lanes=tuple(lanes_a + lanes_b),
                        positions=(position_a, position_b),
                        conflict_type=ConflictType.POSITION,
                        materiality=1.0,
                        reason="Independent reasoning lanes returned different canonical positions.",
                    )
                )

    return ConsensusArtifact(
        task_id=task_id,
        decision_id=decision_id,
        lanes=lane_results,
        panel_state=panel,
        agreement=agreement,
        resolution=resolution,
        selected_position=selected,
        agreement_score=agreement_score,
        conflicts=tuple(conflicts),
        resolution_reason=reason,
    )
