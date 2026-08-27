from backend.agents.consensus_contracts import LaneResult, LaneStatus
from backend.agents.consensus_engine import build_consensus


def lane(name: str, position: str, *, status=LaneStatus.SUCCESS) -> LaneResult:
    return LaneResult(lane_id=name, position=position, status=status)


def test_unanimous_full_panel():
    result = build_consensus("t1", "d1", (lane("baseline", "healthy"), lane("claude", "HEALTHY"), lane("ox_alpha", " healthy ")))
    assert result.panel_state.value == "full"
    assert result.agreement.value == "unanimous"
    assert result.selected_position == "healthy"
    assert result.agreement_score == 1.0


def test_two_of_three_is_majority():
    result = build_consensus("t2", "d2", (lane("baseline", "healthy"), lane("claude", "healthy"), lane("ox_alpha", "unhealthy")))
    assert result.agreement.value == "majority"
    assert result.selected_position == "healthy"
    assert result.agreement_score == 2 / 3


def test_degraded_disagreement_is_not_majority():
    result = build_consensus("t3", "d3", (lane("baseline", "healthy"), lane("claude", "unhealthy"), lane("ox_alpha", "", status=LaneStatus.TIMEOUT)))
    assert result.panel_state.value == "degraded"
    assert result.agreement.value == "split"
    assert result.resolution.value == "verification_required"


def test_single_success_abstains():
    result = build_consensus("t4", "d4", (lane("baseline", "healthy"), lane("claude", "", status=LaneStatus.ERROR), lane("ox_alpha", "", status=LaneStatus.TIMEOUT)))
    assert result.panel_state.value == "insufficient"
    assert result.resolution.value == "abstain"


def test_three_way_disagreement_is_split():
    result = build_consensus("t5", "d5", (lane("baseline", "healthy"), lane("claude", "degraded"), lane("ox_alpha", "unhealthy")))
    assert result.agreement.value == "split"
    assert result.resolution.value == "verification_required"
    assert len(result.conflicts) == 3


def test_high_impact_non_unanimous_requires_human():
    result = build_consensus("t6", "d6", (lane("baseline", "healthy"), lane("claude", "healthy"), lane("ox_alpha", "unhealthy")), high_impact=True)
    assert result.resolution.value == "human_review_required"
