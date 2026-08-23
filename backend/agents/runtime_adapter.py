"""Sandbox-neutral adapter contract for externally supplied agent runtimes.

The adapter deliberately contains no arbitrary code execution. Implementations
must provide their own isolated execution boundary and return an AgentResult.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Mapping

from .base import AgentResult, AgentTask


@dataclass(frozen=True)
class AgentRuntimeDescriptor:
    runtime_id: str
    version: str
    protocol: str
    capabilities: tuple[str, ...]


class AgentRuntimeAdapter(ABC):
    """Contract between the Agent Fabric and an isolated agent runtime."""

    descriptor: AgentRuntimeDescriptor

    @abstractmethod
    async def health(self) -> Mapping[str, Any]:
        """Return runtime health without executing a task."""
        raise NotImplementedError

    @abstractmethod
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute a task inside the adapter's own isolation boundary."""
        raise NotImplementedError

    async def shutdown(self) -> None:
        """Release runtime resources."""
        return None


class InProcessRuntimeAdapter(AgentRuntimeAdapter):
    """Development adapter for canonical ArchOS agents.

    This adapter is intentionally not presented as a production sandbox. It is
    useful for contract tests and for binding existing Agent implementations.
    """

    def __init__(self, agent: Any, runtime_id: str = "archos-inprocess") -> None:
        self.agent = agent
        self.descriptor = AgentRuntimeDescriptor(
            runtime_id=runtime_id,
            version="1",
            protocol="archos-agent-runtime-v1",
            capabilities=tuple(c.value for c in agent.capabilities),
        )

    async def health(self) -> Mapping[str, Any]:
        return {"status": "healthy", "runtime_id": self.descriptor.runtime_id, "protocol": self.descriptor.protocol}

    async def execute(self, task: AgentTask) -> AgentResult:
        return await self.agent.execute(task)
