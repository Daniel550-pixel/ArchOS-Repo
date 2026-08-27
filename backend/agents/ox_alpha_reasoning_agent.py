"""Ox Alpha reasoning specialist for the canonical ArchOS swarm."""
from __future__ import annotations

import json

from app.services.ox_alpha_agent_fabric import OxAlphaRequest, ox_alpha_agent_fabric
from .base import AgentTask, AgentResult, RealityLevel
from .specialists import ReasoningAgent


class OxAlphaReasoningAgent(ReasoningAgent):
    """Independent peer reasoning lane; never receives execution authority."""

    def __init__(self):
        super().__init__()
        self.id = "ox_alpha_reasoning"
        self.name = "Ox Alpha Long-Context Reasoning Specialist"
        self.description = "Independent Ox Alpha reasoning lane for long-context and agentic analysis."
        self.supported_tools = ["ox_alpha_model"]

    @staticmethod
    def _parse_structured(content: str | None) -> tuple[str | None, str]:
        if not content:
            return None, ""
        try:
            raw = content.strip()
            if raw.startswith("```"):
                raw = raw.strip("`")
                if raw.startswith("json"):
                    raw = raw[4:].lstrip()
            payload = json.loads(raw)
            position = payload.get("position") or payload.get("canonical_position")
            rationale = payload.get("rationale") or payload.get("analysis") or ""
            return (str(position).strip() if position else None, str(rationale))
        except (json.JSONDecodeError, TypeError, AttributeError):
            # Preserve provider prose as rationale, but never promote prose into
            # the consensus position.
            return None, content.strip()

    async def _run(self, task: AgentTask) -> AgentResult:
        query = task.payload.get("normalized_query", "")
        domain = task.payload.get("domain", "GENERAL_INTELLIGENCE")
        world_model = task.payload.get("world_model_state", {})
        research = task.payload.get("research_findings", {})

        prompt = (
            "Analyze the ArchOS intelligence query independently using only the supplied context. "
            "Do not infer or imitate other model positions. Never issue commands or claim execution authority. "
            "Return ONLY valid JSON with this exact shape: "
            '{"position":"CANONICAL_POSITION","rationale":"concise reasoning"}. '
            "The position must be a short canonical decision label, not a paragraph. "
            "Separate observations from inferences and identify uncertainty in the rationale.\n\n"
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

        position, rationale = self._parse_structured(response.content)
        output = {
            "model_route": response.model,
            "position": position,
            "rationale": rationale,
            "ox_alpha_analysis": response.content or None,
            "deductions": [rationale] if rationale else [],
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
