import pytest

from backend.agents.base import AgentCapability, AgentTask, RiskLevel
from backend.agents.swarm import swarm
from backend.jarvis.runtime import run


@pytest.mark.asyncio
async def test_financial_specialist_is_registered():
    agent = swarm.get_agent("financial_intelligence")
    assert agent is not None
    assert AgentCapability.FINANCIAL_INTELLIGENCE in agent.capabilities


@pytest.mark.asyncio
async def test_financial_specialist_is_analytical_only():
    task = AgentTask(
        task_id="test-financial",
        intent="FINANCIAL_ASSESSMENT",
        payload={"market_data": [{"symbol": "TEST", "price": 100, "volatility": 0.1, "volume": 1000, "trend": "UP"}]},
        required_capabilities={AgentCapability.FINANCIAL_INTELLIGENCE},
        risk_level=RiskLevel.READ_ONLY,
    )
    result = await swarm.route(task)
    assert result.status == "SUCCESS"
    assert result.output["execution_authority"] is False


@pytest.mark.asyncio
async def test_jarvis_receives_promoted_financial_context(monkeypatch):
    from backend.jarvis import runtime

    captured = {}

    async def fake_orchestrate(**kwargs):
        captured.update(kwargs)
        return {
            "final_answer": "ok",
            "task_id": "task-test",
            "stages": [],
            "inter_agent_messages": [],
            "verification_status": "VERIFIED",
            "reality": "OBSERVED",
            "confidence": 1.0,
            "execution_time_ms": 1.0,
        }

    monkeypatch.setattr(runtime.jarvis_orchestrator, "orchestrate", fake_orchestrate)
    result = await run({
        "query": "Assess TEST",
        "market_data": [{"symbol": "TEST", "price": 100, "volatility": 0.1, "volume": 1000, "trend": "UP"}],
    })

    assert result["integrations"]["financial_intelligence"] is True
    assert result["integrations"]["financial_execution_authority"] is False
    assert "financial_intelligence" in captured["context"]
