"""Runtime adapter binding Ox Alpha to the ArchOS Agent Fabric contract."""
from __future__ import annotations

from typing import Any, Mapping

from .base import AgentResult, AgentTask
from .ox_alpha_reasoning_agent import OxAlphaReasoningAgent
from .runtime_adapter import AgentRuntimeAdapter, AgentRuntimeDescriptor


class OxAlphaRuntimeAdapter(AgentRuntimeAdapter):
    """Governed Ox Alpha runtime; model output cannot execute system actions."""

    def __init__(self, agent: Any | None = None):
        self.agent = agent or OxAlphaReasoningAgent()
        self.descriptor = AgentRuntimeDescriptor(
            runtime_id="ox-alpha",
            version="1",
            protocol="archos-agent-runtime-v1",
            capabilities=tuple(c.value for c in self.agent.capabilities),
        )

    async def health(self) -> Mapping[str, Any]:
        from app.services.ox_alpha_agent_fabric import ox_alpha_agent_fabric
        result = await ox_alpha_agent_fabric.health()
        return {**result, "runtime_id": self.descriptor.runtime_id, "protocol": self.descriptor.protocol}

    async def execute(self, task: AgentTask) -> AgentResult:
        return await self.agent.execute(task)
