import pytest

from backend.services.policy_engine import PolicyEngine


@pytest.mark.asyncio
async def test_policy_engine_denies_anonymous_actor():
    decision = await PolicyEngine().evaluate(
        {"actor": "anonymous", "action": "read", "target": "world"}
    )
    assert decision.allowed is False
    assert decision.policy == "archos.identity"


@pytest.mark.asyncio
async def test_policy_engine_requires_target_for_high_impact_action():
    decision = await PolicyEngine().evaluate(
        {"actor": "operator", "action": "execute", "target": "", "risk_level": "HIGH_IMPACT"}
    )
    assert decision.allowed is False
    assert decision.policy == "archos.target"


@pytest.mark.asyncio
async def test_policy_engine_delegates_authorization(monkeypatch):
    async def allow(_context):
        return True

    monkeypatch.setattr("backend.services.policy_engine.abac.decide", allow)
    decision = await PolicyEngine().evaluate(
        {
            "actor": "operator",
            "agent": "simulation",
            "action": "run",
            "target": "scenario-1",
            "risk_level": "LOW_RISK",
            "correlation_id": "test-correlation",
        }
    )
    assert decision.allowed is True
    assert decision.policy == "archos.abac"
