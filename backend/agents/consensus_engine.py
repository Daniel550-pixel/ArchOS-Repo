"""Deterministic, failure-tolerant consensus engine for ArchOS."""

from __future__ import annotations

from collections import Counter
from typing import Iterable

from .consensus_contracts import (
    AgreementState,
    CanonicalPosition,
    Conflict,
    ConflictType,
    ConsensusArtifact,
    LaneResult,
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
    """Reduce independent lane results without treating failures as votes."""
    lane_results = tuple(lanes)
    successful = tuple(l for l in lane_results if l.successful)
    expected = len(lane_results)

    if expected == 0 or len(successful) <= 1:
        panel = PanelState.INSUFFICIENT
    elif len(successful) == expected:
        panel = PanelState.FULL
    else:
        panel = PanelState.DEGRADED

    positions = tuple(l.position for l in successful if normalize_position(l.position) is not None)
    counts = Counter(positions)
    unique = len(counts)

    selected: CanonicalPosition | None = None
    if counts:
        selected = counts.most_common(1)[0][0]

    if not positions:
        agreement = AgreementState.ABSTAINED
        resolution = ResolutionState.ABSTAIN
        reason = "No successful lane produced a canonical position."
    elif unique == 1:
        agreement = AgreementState.UNANIMOUS
        if high_impact and not all(l.evidence for l in successful):
            resolution = ResolutionState.HUMAN_REVIEW_REQUIRED
            reason = "High-impact decision is unanimous but not evidence-backed by every lane."
        elif not any(l.evidence for l in successful):
            resolution = ResolutionState.VERIFICATION_REQUIRED
            reason = "Full agreement exists but no lane supplied evidence."
        else:
            resolution = ResolutionState.CONSENSUS
            reason = "Full panel agrees on a canonical position with evidence."
    elif len(positions) >= 3 and counts.most_common(1)[0][1] > len(positions) / 2:
        agreement = AgreementState.MAJORITY
        if high_impact:
            resolution = ResolutionState.HUMAN_REVIEW_REQUIRED
            reason = "High-impact decision has majority agreement but not unanimity."
        else:
            resolution = ResolutionState.VERIFICATION_REQUIRED
            reason = "Full or degraded panel has a majority but not unanimous agreement."
    else:
        agreement = AgreementState.SPLIT
        resolution = ResolutionState.HUMAN_REVIEW_REQUIRED if high_impact else ResolutionState.VERIFICATION_REQUIRED
        if panel is PanelState.DEGRADED:
            reason = "Panel degraded; remaining lanes disagree and a majority cannot resolve the decision."
        elif panel is PanelState.FULL:
            reason = "Full panel returned conflicting canonical positions."
        else:
            reason = "Insufficient panel produced conflicting canonical positions."

    agreement_score = (counts.most_common(1)[0][1] / len(positions)) if positions else 0.0

    conflicts: list[Conflict] = []
    grouped: dict[CanonicalPosition, list[str]] = {}
    for lane in successful:
        position = normalize_position(lane.position)
        if position is not None:
            grouped.setdefault(position, []).append(lane.lane_id)

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
