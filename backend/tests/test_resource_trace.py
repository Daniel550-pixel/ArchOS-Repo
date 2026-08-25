from app.core.resource_execution import ResourceProfile, ResourceSnapshot, plan_execution
from app.core.resource_trace import ResourceExecutionTrace


def test_resource_decision_is_replayable() -> None:
    profile = ResourceProfile(memory_required_bytes=8_000, compute_required_units=10)
    snapshot = ResourceSnapshot(available_memory_bytes=16_000, available_compute_units=20)
    decision = plan_execution(profile, snapshot)

    trace = ResourceExecutionTrace.from_decision(
        execution_id="exec-001",
        workload_id="workload-001",
        decision=decision,
        memory_available_bytes=snapshot.available_memory_bytes,
        memory_required_bytes=profile.memory_required_bytes,
        compute_available_units=snapshot.available_compute_units,
        compute_required_units=profile.compute_required_units,
    )

    assert trace.accepted is True
    assert trace.replayable_mode is not None
    assert trace.to_dict()["execution_id"] == "exec-001"
    assert trace.to_dict()["workload_id"] == "workload-001"
    assert trace.to_dict()["memory_available_bytes"] == 16_000
