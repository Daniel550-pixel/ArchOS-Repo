"""Runtime adapter registry and health boundary."""
import asyncio
from typing import Any

from .runtime_adapter import AgentRuntimeAdapter


class RuntimeAdapterRegistry:
    def __init__(self) -> None:
        self._adapters: dict[str, AgentRuntimeAdapter] = {}
        self._lock = asyncio.Lock()

    async def bind(self, agent_id: str, adapter: AgentRuntimeAdapter) -> None:
        async with self._lock:
            if agent_id in self._adapters:
                raise ValueError(f"Runtime adapter already bound for {agent_id}")
            self._adapters[agent_id] = adapter

    def get(self, agent_id: str) -> AgentRuntimeAdapter | None:
        return self._adapters.get(agent_id)

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
