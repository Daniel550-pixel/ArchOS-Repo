import pytest

from app.services.integration_runtime import integration_runtime
from backend.agents.action_gate import ActionRequest, action_gate
from backend.agents.base import RiskLevel, ActionDecision


@pytest.mark.asyncio
async def test_modbus_observation_is_read_only():
    state = await integration_runtime.modbus_state()
    assert "source" in state
    assert state.get("reality") in {"OBSERVED", "EMULATED", "FALLBACK"}


@pytest.mark.asyncio
async def test_modbus_write_requires_governance():
    action = ActionRequest(
        actor="operator",
        agent="integration-orchestrator",
        target="building-management-system",
        requested_operation="MODBUS_WRITE",
        risk_level=RiskLevel.HIGH_IMPACT,
        payload={"updates": {"supply_temp_c": 7.2}},
    )
    decision = await action_gate.evaluate_and_submit(action)
    assert decision in {ActionDecision.REQUIRES_APPROVAL, ActionDecision.DENIED}
    if decision == ActionDecision.REQUIRES_APPROVAL:
        assert action.action_id in {item["action_id"] for item in action_gate.get_pending()}


@pytest.mark.asyncio
async def test_osm_adapter_returns_typed_collection():
    buildings = await integration_runtime.buildings()
    assert isinstance(buildings, list)
    for building in buildings:
        assert "name" in building
        assert "height" in building
        assert "levels" in building
