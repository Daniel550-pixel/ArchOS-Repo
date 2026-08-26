"""Claude-backed reasoning specialist for the canonical JARVIS swarm.

Claude augments the existing model router rather than replacing it. The agent
returns structured, evidence-aware deductions and never receives execution
authority. If Anthropic is not configured, the existing reasoning path remains
fully functional.
"""
from __future__ import annotations

import json

from app.services.claude_agent_fabric import ClaudeAgentRequest, claude_agent_fabric
from .base import AgentTask, AgentResult, RealityLevel
from .specialists import ReasoningAgent


class ClaudeReasoningAgent(ReasoningAgent):
    """Canonical reasoning agent with Claude as an additional reasoning lane."""

    async def _run(self, task: AgentTask) -> AgentResult:
        baseline = await super()._run(task)

        query = task.payload.get("normalized_query", "")
        domain = task.payload.get("domain", "GENERAL_INTELLIGENCE")
        world_model = task.payload.get("world_model_state", {})
        research = task.payload.get("research_findings", {})

        prompt = (
            "Analyze the ArchOS intelligence query using only the supplied context. "
            "Return concise, evidence-aware reasoning. Separate observations from "
            "inferences and identify material uncertainty. Do not issue commands or "
            "recommend unrestricted system actions.\n\n"
            f"QUERY: {query}\nDOMAIN: {domain}\n"
            f"WORLD_MODEL: {json.dumps(world_model, default=str)[:12000]}\n"
            f"RESEARCH: {json.dumps(research, default=str)[:12000]}"
        )
        claude = await claude_agent_fabric.run(
            ClaudeAgentRequest(
                role="reasoning",
                prompt=prompt,
                metadata={"task_id": task.task_id, "domain": domain},
            )
        )

        output = dict(baseline.output)
        output["model_consensus"] = {
            "baseline": {
                "provider": "archos_model_router",
                "model": output.get("model_route"),
                "status": baseline.status,
            },
            "claude": {
                "provider": claude.provider,
                "model": claude.model,
                "status": claude.status,
                "is_real": claude.is_real,
                "execution_authority": claude.execution_authority,
                "error": claude.error,
            },
        }

        if claude.is_real and claude.content:
            output["claude_analysis"] = claude.content
            output["deductions"] = [*output.get("deductions", []), claude.content]
            output["synthesis"] = " ".join(output["deductions"])
            output["confidence_score"] = min(0.98, max(float(output.get("confidence_score", 0.88)), 0.95))
            reality = RealityLevel.INFERRED
            provenance = f"reasoning:multi_model:baseline+claude:{claude.model}"
        else:
            output["claude_analysis"] = None
            reality = baseline.reality
            provenance = f"reasoning:multi_model:baseline+claude_unavailable"

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status=baseline.status,
            output=output,
            reality=reality,
            confidence=float(output.get("confidence_score", baseline.confidence)),
            provenance=provenance,
            evidence=baseline.evidence + (["Claude Agent Fabric reasoning lane"] if claude.is_real else []),
            execution_time_ms=baseline.execution_time_ms,
        )
