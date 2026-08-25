import unittest
from backend.agents.base import AgentCapability, AgentTask, RealityLevel
from backend.agents.multimodal_intelligence_agent import MultimodalIntelligenceAgent


class TestMultimodalArchosIntegration(unittest.IsolatedAsyncioTestCase):
    async def test_multimodal_agent_contract(self):
        self.assertIn(AgentCapability.MULTIMODAL_INTELLIGENCE, MultimodalIntelligenceAgent().capabilities)

    async def test_multimodal_agent_fails_closed_without_provider(self):
        result = await MultimodalIntelligenceAgent().execute(AgentTask("mm-test", "analyze this", {"prompt": "analyze this"}))
        self.assertEqual(result.status, "DEGRADED")
        self.assertEqual(result.reality, RealityLevel.FALLBACK)
        self.assertFalse(result.output["execution_authority"])

    async def test_multimodal_agent_routes_media_to_provider(self):
        class StubProvider:
            async def generate(self, request):
                raise AssertionError("generate must not be used for media")

            async def ground(self, request):
                raise AssertionError("ground must not be used for media")

            async def analyze_media(self, request):
                from backend.intelligence.multimodal_intelligence import MultimodalResult
                return MultimodalResult("verified observation", "analysis", 0.91, provenance="stub")

        result = await MultimodalIntelligenceAgent(StubProvider()).execute(
            AgentTask("mm-media", "inspect image", {"media_base64": "abc", "media_mime_type": "image/png"})
        )
        self.assertEqual(result.status, "SUCCESS")
        self.assertEqual(result.output["text"], "verified observation")
        self.assertFalse(result.output["execution_authority"])


if __name__ == "__main__":
    unittest.main()

