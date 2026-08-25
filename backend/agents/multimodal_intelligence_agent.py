"""ArchOS multimodal intelligence specialist promoted from Obsidian-AI."""
from __future__ import annotations
from .base import Agent, AgentCapability, AgentResult, AgentTask, RealityLevel
from ..intelligence.multimodal_intelligence import MultimodalRequest, MultimodalProvider

class MultimodalIntelligenceAgent(Agent):
    def __init__(self, provider: MultimodalProvider | None = None):
        super().__init__(id="multimodal_intelligence", name="Multimodal Intelligence Specialist", description="Analyzes text and media through a governed provider contract and preserves grounding/provenance.", capabilities={AgentCapability.MULTIMODAL_INTELLIGENCE}, supported_tools=["multimodal_provider", "media_analysis", "grounding"], reality_default=RealityLevel.INFERRED)
        self.provider = provider

    async def _run(self, task: AgentTask) -> AgentResult:
        request=MultimodalRequest(prompt=str(task.payload.get("prompt",task.intent)),media_mime_type=task.payload.get("media_mime_type"),media_base64=task.payload.get("media_base64"),mode=str(task.payload.get("mode","analysis")),metadata={"task_id":task.task_id,"correlation_id":task.correlation_id})
        if self.provider is None:
            return AgentResult(self.id,task.task_id,"DEGRADED",{"mode":request.mode,"provider_state":"NOT_CONFIGURED","analysis":None,"execution_authority":False},RealityLevel.FALLBACK,0.0,"multimodal:provider_not_configured",["No multimodal provider is configured; no external call was attempted."])
        result=await (self.provider.ground(request) if request.mode=="grounding" else self.provider.analyze_media(request) if request.media_base64 else self.provider.generate(request))
        reality=RealityLevel(result.reality) if result.reality in RealityLevel._value2member_map_ else RealityLevel.INFERRED
        return AgentResult(self.id,task.task_id,"SUCCESS",{"text":result.text,"mode":result.mode,"confidence":result.confidence,"grounding":[{"uri":r.uri,"title":r.title,"source":r.source} for r in result.grounding],"execution_authority":False},reality,max(0.0,min(1.0,result.confidence)),result.provenance,[r.uri for r in result.grounding])
