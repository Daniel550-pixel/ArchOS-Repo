from datetime import datetime

import pytest

from backend.app.services.scenario_planner import ScenarioPlanner
from backend.app.services.scenario_verifier import ScenarioVerifier


def test_planner_requires_confirmation_without_quantitative_assumption():
    plan = ScenarioPlanner().plan(
        "Assess renewable capacity by 2031",
        now=datetime(2026, 8, 21),
    )
    assert plan.requires_confirmation is True
    assert plan.confidence < 0.5


def test_planner_extracts_future_horizon_and_percentage():
    plan = ScenarioPlanner().plan(
        "Increase renewable capacity by 20% by 2031",
        now=datetime(2026, 8, 21),
    )
    assert plan.horizon.year == 2031
    assert plan.assumptions["requested_change_percentages"] == [20.0]
    assert plan.requires_confirmation is False


def test_verifier_rejects_untraceable_causal_path():
    report = {
        "status": "COMPLETED",
        "authoritative_world_model_mutated": False,
        "snapshot_id": "snapshot-1",
        "snapshot_digest": "digest",
        "confidence": 0.9,
        "risk_score": 0.2,
        "baseline_vs_scenario": {"changed_entities": 1, "entity_deltas": {}},
        "causal_propagation": {
            "direct_deltas": {"energy.capacity": 100.0},
            "propagated_effects": {"grid.load": 20.0},
            "paths": [{
                "depth": 1,
                "source": "energy.capacity",
                "target": "grid.load",
                "coefficient": 0.2,
                "effect": 20.0,
                "confidence": 0.9,
                "rationale": "capacity affects load",
                "provenance": "",
            }],
            "nodes_visited": 2,
            "max_depth": 4,
        },
    }
    result = ScenarioVerifier().verify(report)
    assert result.status == "REJECTED"
    assert "causal_paths_valid" in result.violations
