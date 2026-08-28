"""Runtime adapter registry and canonical-agent binding."""
import asyncio
from typing import Any

from .runtime_adapter import AgentRuntimeAdapter, InProcessRuntimeAdapter
from .ox_alpha_runtime_adapter import OxAlphaRuntimeAdapter


class RuntimeAdapterRegistry:
    def __init__(self) -> None:
        self._adapters: dict[str, AgentRuntimeAdapter] = {}
        self._lock = asyncio.Lock()

    async def bind(self, agent_id: str, adapter: AgentRuntimeAdapter) -> None:
        async with self._lock:
            if agent_id in self._adapters:
                raise ValueError(f"Runtime adapter already bound for {agent_id}")
            self._adapters[agent_id] = adapter

    async def bind_if_missing(self, agent_id: str, adapter: AgentRuntimeAdapter) -> bool:
        async with self._lock:
            if agent_id in self._adapters:
                return False
            self._adapters[agent_id] = adapter
            return True

    def get(self, agent_id: str) -> AgentRuntimeAdapter | None:
        return self._adapters.get(agent_id)

    def list_bindings(self) -> list[dict[str, Any]]:
        return [
            {"agent_id": agent_id, "runtime_id": adapter.descriptor.runtime_id, "version": adapter.descriptor.version, "protocol": adapter.descriptor.protocol, "capabilities": list(adapter.descriptor.capabilities)}
            for agent_id, adapter in self._adapters.items()
        ]

    async def health(self) -> dict[str, Any]:
        results: dict[str, Any] = {}
        for agent_id, adapter in self._adapters.items():
            try:
                results[agent_id] = dict(await adapter.health())
            except Exception as exc:
                results[agent_id] = {"status": "unhealthy", "error": type(exc).__name__}
        return {"count": len(results), "runtimes": results}

    async def shutdown(self) -> None:
        for adapter in list(self._adapters.values()):
            await adapter.shutdown()
        self._adapters.clear()


runtime_registry = RuntimeAdapterRegistry()


async def bind_canonical_swarm(swarm: Any) -> None:
    """Bind canonical agents to runtime adapters at application startup."""
    for agent_id, agent in swarm.agents.items():
        if agent_id == "ox_alpha_reasoning":
            await runtime_registry.bind_if_missing(agent_id, OxAlphaRuntimeAdapter(agent))
        else:
            await runtime_registry.bind_if_missing(agent_id, InProcessRuntimeAdapter(agent))
