import pytest
from backend.agents.base import AgentCapability, AgentTask, RealityLevel
from backend.agents.multimodal_intelligence_agent import MultimodalIntelligenceAgent

@pytest.mark.asyncio
async def test_multimodal_agent_contract():
    assert AgentCapability.MULTIMODAL_INTELLIGENCE in MultimodalIntelligenceAgent().capabilities

@pytest.mark.asyncio
async def test_multimodal_agent_fails_closed_without_provider():
    result=await MultimodalIntelligenceAgent().execute(AgentTask("mm-test","analyze this",{"prompt":"analyze this"}))
    assert result.status=="DEGRADED" and result.reality==RealityLevel.FALLBACK
    assert result.output["execution_authority"] is False

@pytest.mark.asyncio
async def test_multimodal_agent_routes_media_to_provider():
    class StubProvider:
        async def generate(self, request): raise AssertionError("generate must not be used for media")
        async def ground(self, request): raise AssertionError("ground must not be used for media")
        async def analyze_media(self, request):
            from backend.intelligence.multimodal_intelligence import MultimodalResult
            return MultimodalResult("verified observation","analysis",0.91,provenance="stub")
    result=await MultimodalIntelligenceAgent(StubProvider()).execute(AgentTask("mm-media","inspect image",{"media_base64":"abc","media_mime_type":"image/png"}))
    assert result.status=="SUCCESS" and result.output["text"]=="verified observation"
    assert result.output["execution_authority"] is False
