from backend.agents.consensus_contracts import CanonicalPosition, LaneResult, LaneStatus
from backend.agents.consensus_engine import build_consensus


def lane(name: str, position: CanonicalPosition | None, *, status=LaneStatus.SUCCESS) -> LaneResult:
    return LaneResult(lane_id=name, position=position, status=status)


def test_unanimous_full_panel():
    result = build_consensus("t1", "d1", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", CanonicalPosition.AFFIRM), lane("ox_alpha", CanonicalPosition.AFFIRM)))
    assert result.panel_state.value == "full"
    assert result.agreement.value == "unanimous"
    assert result.selected_position is CanonicalPosition.AFFIRM
    assert result.agreement_score == 1.0


def test_two_of_three_is_majority():
    result = build_consensus("t2", "d2", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", CanonicalPosition.AFFIRM), lane("ox_alpha", CanonicalPosition.NEGATE)))
    assert result.agreement.value == "majority"
    assert result.selected_position is CanonicalPosition.AFFIRM
    assert result.agreement_score == 2 / 3


def test_degraded_disagreement_is_not_majority():
    result = build_consensus("t3", "d3", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", CanonicalPosition.NEGATE), lane("ox_alpha", None, status=LaneStatus.TIMEOUT)))
    assert result.panel_state.value == "degraded"
    assert result.agreement.value == "split"
    assert result.resolution.value == "verification_required"
    assert "degraded" in result.resolution_reason.lower()


def test_single_success_abstains():
    result = build_consensus("t4", "d4", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", None, status=LaneStatus.ERROR), lane("ox_alpha", None, status=LaneStatus.TIMEOUT)))
    assert result.panel_state.value == "insufficient"
    assert result.resolution.value == "abstain"


def test_three_way_disagreement_is_split():
    result = build_consensus("t5", "d5", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", CanonicalPosition.UNCERTAIN), lane("ox_alpha", CanonicalPosition.NEGATE)))
    assert result.agreement.value == "split"
    assert result.resolution.value == "verification_required"
    assert len(result.conflicts) == 3


def test_high_impact_non_unanimous_requires_human():
    result = build_consensus("t6", "d6", (lane("baseline", CanonicalPosition.AFFIRM), lane("claude", CanonicalPosition.AFFIRM), lane("ox_alpha", CanonicalPosition.NEGATE)), high_impact=True)
    assert result.resolution.value == "human_review_required"
    assert result.selected_position is CanonicalPosition.AFFIRM
