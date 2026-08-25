from __future__ import annotations

from .world_model_runtime import query_authoritative_state

from .base import Agent, AgentCapability, AgentTask, AgentResult, RealityLevel


class AuthoritativeWorldModelAgent(Agent):
    """Canonical World Model agent backed exclusively by persistent temporal state."""

    def __init__(self) -> None:
        super().__init__(
            id="world_model",
            name="Authoritative Temporal World Model Specialist",
            description="Queries PostgreSQL-backed temporal UAE World Model state with provenance.",
            capabilities={AgentCapability.WORLD_MODEL},
            supported_tools=["temporal_wm", "entity_state", "provenance"],
            reality_default=RealityLevel.OBSERVED,
        )

    async def _run(self, task: AgentTask) -> AgentResult:
        entities = task.payload.get("detected_entities", [])
        data = await query_authoritative_state(entities)

        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS",
            output=data,
            reality=RealityLevel.OBSERVED,
            confidence=0.99 if not data.get("missing_attributes") else 0.85,
            provenance="world_model:postgresql:temporal_authority",
            evidence=data.get("evidence", []),
        )
