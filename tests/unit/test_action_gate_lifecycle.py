import pytest

from backend.agents.action_gate import ActionGate, ActionRequest
from backend.agents.base import ActionDecision, RiskLevel


@pytest.mark.asyncio
async def test_low_risk_action_is_allowed_and_can_execute():
    gate = ActionGate()
    request = ActionRequest(
        actor="operator",
        agent="jarvis",
        task_id="task-low-1",
        target="world-model:entity-1",
        requested_operation="read_state",
        risk_level=RiskLevel.LOW_RISK,
    )

    decision = await gate.evaluate_and_submit(request)

    assert decision is ActionDecision.ALLOWED
    assert request.policy_decision is ActionDecision.ALLOWED
    result = await gate.execute_governed(request, lambda: {"status": "read"})

    assert result["status"] == "SUCCESS"
    assert result["output"] == {"status": "read"}


@pytest.mark.asyncio
async def test_consequential_action_requires_approval_before_execution():
    gate = ActionGate()
    request = ActionRequest(
        actor="operator",
        agent="jarvis",
        task_id="task-consequential-1",
        target="bms:building-1",
        requested_operation="set_chiller_target",
        risk_level=RiskLevel.CONSEQUENTIAL,
    )

    decision = await gate.evaluate_and_submit(request)

    assert decision is ActionDecision.REQUIRES_APPROVAL
    assert request.action_id in {item["action_id"] for item in gate.get_pending()}
    with pytest.raises(PermissionError):
        await gate.execute_governed(request, lambda: {"should": "not-run"})

    assert await gate.approve(request.action_id, "authorized-operator") is True
    approved = gate.get_action(request.action_id)
    assert approved is not None
    assert approved.policy_decision is ActionDecision.ALLOWED
    assert approved.approved_by == "authorized-operator"

    result = await gate.execute_governed(approved, lambda: {"status": "changed"})
    assert result["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_missing_identity_is_blocked_and_never_enters_pending_queue():
    gate = ActionGate()
    request = ActionRequest(
        actor="",
        agent="jarvis",
        task_id="task-denied-1",
        target="bms:building-1",
        requested_operation="set_chiller_target",
        risk_level=RiskLevel.HIGH_IMPACT,
    )

    decision = await gate.evaluate_and_submit(request)

    assert decision is ActionDecision.DENIED
    assert request.approval_state == "REJECTED"
    assert gate.get_pending() == []
    with pytest.raises(PermissionError):
        await gate.execute_governed(request, lambda: {"should": "never-run"})


@pytest.mark.asyncio
async def test_executor_failure_is_recorded_as_failed_execution():
    gate = ActionGate()
    request = ActionRequest(
        actor="operator",
        agent="jarvis",
        task_id="task-failure-1",
        target="simulation:scenario-1",
        requested_operation="run_simulation",
        risk_level=RiskLevel.LOW_RISK,
    )

    assert await gate.evaluate_and_submit(request) is ActionDecision.ALLOWED

    def failing_executor():
        raise RuntimeError("executor unavailable")

    with pytest.raises(RuntimeError, match="executor unavailable"):
        await gate.execute_governed(request, failing_executor)

    assert request.execution_result == {"status": "FAILED"}
