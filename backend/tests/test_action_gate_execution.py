import pytest

from backend.agents.action_gate import ActionGate, ActionRequest
from backend.agents.base import ActionDecision, RiskLevel


@pytest.mark.asyncio
async def test_denied_policy_never_executes():
    gate = ActionGate()
    request = ActionRequest(
        actor="",
        agent="test-agent",
        target="system",
        requested_operation="write",
        risk_level=RiskLevel.LOW_RISK,
    )
    executed = False

    async def executor():
        nonlocal executed
        executed = True
        return {"ok": True}

    decision = await gate.evaluate_and_submit(request)
    assert decision is ActionDecision.DENIED
    with pytest.raises(PermissionError):
        await gate.execute_governed(request, executor)
    assert executed is False


@pytest.mark.asyncio
async def test_consequential_action_requires_approval_before_execution():
    gate = ActionGate()
    request = ActionRequest(
        actor="operator",
        agent="test-agent",
        target="controlled-system",
        requested_operation="restart",
        risk_level=RiskLevel.CONSEQUENTIAL,
    )

    executed = False

    async def executor():
        nonlocal executed
        executed = True
        return {"ok": True}

    decision = await gate.evaluate_and_submit(request)
    assert decision is ActionDecision.REQUIRES_APPROVAL
    assert request.approval_state == "PENDING"
    with pytest.raises(PermissionError):
        await gate.execute_governed(request, executor)
    assert executed is False

    assert await gate.approve(request.action_id, "human-operator") is True
    request = gate.get_action(request.action_id)
    assert request is not None
    assert request.policy_decision is ActionDecision.ALLOWED
    assert request.approval_state == "APPROVED"

    result = await gate.execute_governed(request, executor)
    assert result["status"] == "SUCCESS"
    assert executed is True


@pytest.mark.asyncio
async def test_executor_failure_is_recorded_and_rejected_execution_is_blocked():
    gate = ActionGate()
    request = ActionRequest(
        actor="operator",
        agent="test-agent",
        target="read-only-target",
        requested_operation="inspect",
        risk_level=RiskLevel.LOW_RISK,
    )
    assert await gate.evaluate_and_submit(request) is ActionDecision.ALLOWED

    async def failing_executor():
        raise RuntimeError("simulated execution failure")

    with pytest.raises(RuntimeError):
        await gate.execute_governed(request, failing_executor)
    assert request.execution_result == {"status": "FAILED"}
