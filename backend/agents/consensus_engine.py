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


def build_consensus(task_id: str, decision_id: str, lanes: Iterable[LaneResult], *, high_impact: bool = False) -> ConsensusArtifact:
    """Reduce independent lane results. Failures never become votes."""
    lane_results = tuple(lanes)
    successful = tuple(lane for lane in lane_results if lane.successful)

    if len(successful) <= 1:
        panel = PanelState.INSUFFICIENT
    elif len(successful) == len(lane_results):
        panel = PanelState.FULL
    else:
        panel = PanelState.DEGRADED

    positions = tuple(normalize_position(lane.position) for lane in successful)
    positions = tuple(position for position in positions if position is not None)
    counts = Counter(positions)
    unique = len(counts)
    proposed = counts.most_common(1)[0][0] if counts else None

    if not positions:
        agreement = AgreementState.ABSTAINED
        resolution = ResolutionState.ABSTAIN
        reason = "No successful lane produced a canonical position."
    elif unique == 1:
        agreement = AgreementState.UNANIMOUS
        evidence_backed = all(lane.evidence for lane in successful)
        if high_impact:
            resolution = ResolutionState.HUMAN_REVIEW_REQUIRED
            reason = "High-impact decision requires human review even with unanimous model agreement."
        elif not evidence_backed:
            resolution = ResolutionState.VERIFICATION_REQUIRED
            reason = "Unanimous reasoning lacks evidence from every successful lane."
        else:
            resolution = ResolutionState.CONSENSUS
            reason = "Full panel agrees on a canonical position with lane evidence."
    elif len(successful) >= 3 and counts.most_common(1)[0][1] > len(successful) / 2:
        agreement = AgreementState.MAJORITY
        resolution = ResolutionState.HUMAN_REVIEW_REQUIRED if high_impact else ResolutionState.VERIFICATION_REQUIRED
        reason = "High-impact decision has non-unanimous majority agreement." if high_impact else "Majority agreement requires independent verification."
    else:
        agreement = AgreementState.SPLIT
        resolution = ResolutionState.HUMAN_REVIEW_REQUIRED if high_impact else ResolutionState.VERIFICATION_REQUIRED
        reason = (
            "Panel degraded; remaining lanes disagree and a majority cannot resolve the decision."
            if panel is PanelState.DEGRADED
            else "Full panel returned conflicting canonical positions."
        )

    # A proposed position is informational only. It is never exposed as a selected
    # decision when governance requires human review.
    selected = None if resolution is ResolutionState.HUMAN_REVIEW_REQUIRED else proposed
    agreement_score = (max(counts.values()) / len(positions)) if positions else 0.0

    conflicts: list[Conflict] = []
    grouped: dict[CanonicalPosition, list[str]] = {}
    for lane in successful:
        position = normalize_position(lane.position)
        if position is not None:
            grouped.setdefault(position, []).append(lane.lane_id)
    groups = list(grouped.items())
    for i, (position_a, lanes_a) in enumerate(groups):
        for position_b, lanes_b in groups[i + 1:]:
            conflicts.append(Conflict(
                claim_id=task_id,
                lanes=tuple(lanes_a + lanes_b),
                positions=(position_a, position_b),
                conflict_type=ConflictType.POSITION,
                materiality=1.0,
                reason="Independent reasoning lanes returned different canonical positions.",
            ))

    return ConsensusArtifact(
        task_id=task_id,
        decision_id=decision_id,
        lanes=lane_results,
        panel_state=panel,
        agreement=agreement,
        resolution=resolution,
        proposed_position=proposed,
        selected_position=selected,
        agreement_score=agreement_score,
        conflicts=tuple(conflicts),
        resolution_reason=reason,
    )
