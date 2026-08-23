"""Public agent registration contract for ArchOS integrations."""

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True)
class AgentCapability:
    name: str
    description: str = ""
    input_schema: Mapping[str, Any] = field(default_factory=dict)
    output_schema: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class AgentRegistration:
    agent_id: str
    name: str
    version: str
    capabilities: tuple[AgentCapability, ...]
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def to_payload(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "version": self.version,
            "capabilities": [
                {
                    "name": capability.name,
                    "description": capability.description,
                    "input_schema": dict(capability.input_schema),
                    "output_schema": dict(capability.output_schema),
                }
                for capability in self.capabilities
            ],
            "metadata": dict(self.metadata),
        }
