import unittest
from unittest.mock import AsyncMock

from backend.agents.base import AgentCapability, AgentTask, RiskLevel
from backend.agents.swarm import swarm
from backend.jarvis.runtime import run


class TestFinsightJarvisIntegration(unittest.IsolatedAsyncioTestCase):
    async def test_financial_specialist_is_registered(self):
        agent = swarm.get_agent("financial_intelligence")
        self.assertIsNotNone(agent)
        self.assertIn(AgentCapability.FINANCIAL_INTELLIGENCE, agent.capabilities)

    async def test_financial_specialist_is_analytical_only(self):
        task = AgentTask(
            task_id="test-financial",
            intent="FINANCIAL_ASSESSMENT",
            payload={"market_data": [{"symbol": "TEST", "price": 100, "volatility": 0.1, "volume": 1000, "trend": "UP"}]},
            required_capabilities={AgentCapability.FINANCIAL_INTELLIGENCE},
            risk_level=RiskLevel.READ_ONLY,
        )
        result = await swarm.route(task)
        self.assertEqual(result.status, "SUCCESS")
        self.assertFalse(result.output["execution_authority"])

    async def test_jarvis_receives_promoted_financial_context(self):
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

        orig_orchestrate = runtime.jarvis_orchestrator.orchestrate
        runtime.jarvis_orchestrator.orchestrate = fake_orchestrate
        try:
            result = await run({
                "query": "Assess TEST",
                "market_data": [{"symbol": "TEST", "price": 100, "volatility": 0.1, "volume": 1000, "trend": "UP"}],
            })

            self.assertTrue(result["integrations"]["financial_intelligence"])
            self.assertFalse(result["integrations"]["financial_execution_authority"])
            self.assertIn("financial_intelligence", captured["context"])
        finally:
            runtime.jarvis_orchestrator.orchestrate = orig_orchestrate


if __name__ == "__main__":
    unittest.main()

