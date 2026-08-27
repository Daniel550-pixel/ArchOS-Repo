"""Claude independent reasoning lane for governed ArchOS consensus."""
from __future__ import annotations
import json
from app.services.claude_agent_fabric import ClaudeAgentRequest, claude_agent_fabric
from .base import AgentTask, AgentResult, RealityLevel
from .specialists import ReasoningAgent


class ClaudeReasoningAgent(ReasoningAgent):
    """Independent Claude peer; never an orchestrator or execution authority."""
    def __init__(self):
        super().__init__()
        self.id = "claude_reasoning"
        self.name = "Claude Independent Reasoning Specialist"
        self.description = "Independent Claude reasoning lane for evidence-aware cross-model consensus."
        self.supported_tools = ["claude_model"]

    async def _run(self, task: AgentTask) -> AgentResult:
        query = task.payload.get("normalized_query", "")
        domain = task.payload.get("domain", "GENERAL_INTELLIGENCE")
        world_model = task.payload.get("world_model_state", {})
        research = task.payload.get("research_findings", {})
        prompt = (
            "Analyze the ArchOS intelligence query independently. Return ONLY JSON with exactly "
            "canonical_position (affirm|negate|uncertain|abstain), rationale (string), confidence "
            "(number 0..1), and evidence (array of strings). Never issue commands. Do not reference "
            "or imitate other model lanes.\n\n"
            f"QUERY: {query}\nDOMAIN: {domain}\nWORLD_MODEL: {json.dumps(world_model, default=str)[:12000]}\n"
            f"RESEARCH: {json.dumps(research, default=str)[:12000]}"
        )
        claude = await claude_agent_fabric.run(ClaudeAgentRequest(role="reasoning", prompt=prompt, metadata={"task_id": task.task_id, "domain": domain}))
        output = {"model_route": claude.model, "claude_analysis": claude.content or None, "deductions": [claude.content] if claude.content else [], "synthesis": claude.content or "", "confidence_score": 0.0 if not claude.is_real else 0.90, "execution_authority": claude.execution_authority, "provider_status": claude.status, "provider_error": claude.error}
        return AgentResult(self.id, task.task_id, claude.status, output, RealityLevel.INFERRED if claude.is_real else RealityLevel.FALLBACK, output["confidence_score"], f"reasoning:claude:{claude.model}", ["Claude independent reasoning lane"] if claude.is_real else [], error=claude.error)
