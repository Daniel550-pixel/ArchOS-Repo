"""Ox Alpha reasoning specialist for the canonical ArchOS swarm."""
from __future__ import annotations

import json

from app.services.ox_alpha_agent_fabric import OxAlphaRequest, ox_alpha_agent_fabric
from .base import AgentTask, AgentResult, RealityLevel
from .specialists import ReasoningAgent


class OxAlphaReasoningAgent(ReasoningAgent):
    """Peer reasoning lane; it never receives execution authority."""

    def __init__(self):
        super().__init__()
        self.id = "ox_alpha_reasoning"
        self.name = "Ox Alpha Long-Context Reasoning Specialist"
        self.description = "Independent Ox Alpha reasoning lane for long-context and agentic analysis."
        self.supported_tools = ["ox_alpha_model"]

    async def _run(self, task: AgentTask) -> AgentResult:
        query = task.payload.get("normalized_query", "")
        domain = task.payload.get("domain", "GENERAL_INTELLIGENCE")
        world_model = task.payload.get("world_model_state", {})
        research = task.payload.get("research_findings", {})

        prompt = (
            "Analyze the ArchOS intelligence query using only the supplied context. "
            "Return a concise, evidence-aware position. Separate observations from "
            "inferences, identify uncertainty, and do not issue commands or claim "
            "execution authority. Your answer will be compared with independent model lanes.\n\n"
            f"QUERY: {query}\nDOMAIN: {domain}\n"
            f"WORLD_MODEL: {json.dumps(world_model, default=str)[:30000]}\n"
            f"RESEARCH: {json.dumps(research, default=str)[:30000]}"
        )
        response = await ox_alpha_agent_fabric.run(
            OxAlphaRequest(
                role="reasoning",
                prompt=prompt,
                system="You are a governed ArchOS peer reasoning specialist. Never execute actions.",
                metadata={"task_id": task.task_id, "domain": domain},
            )
        )

        output = {
            "model_route": response.model,
            "ox_alpha_analysis": response.content or None,
            "deductions": [response.content] if response.content else [],
            "confidence_score": 0.0 if not response.is_real else 0.90,
            "execution_authority": response.execution_authority,
            "provider_status": response.status,
            "provider_error": response.error,
        }
        reality = RealityLevel.INFERRED if response.is_real else RealityLevel.FALLBACK
        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status=response.status,
            output=output,
            reality=reality,
            confidence=output["confidence_score"],
            provenance=f"reasoning:ox_alpha:{response.model}",
            evidence=["Ox Alpha independent reasoning lane"] if response.is_real else [],
            error=response.error,
        )
