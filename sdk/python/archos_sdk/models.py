"""Small response models used by the public ArchOS SDK."""

from dataclasses import dataclass
from typing import Any, Mapping


@dataclass(frozen=True)
class JarvisResult:
    task_id: str | None
    verification_status: str | None
    raw: Mapping[str, Any]


@dataclass(frozen=True)
class ActionDecision:
    action_id: str
    decision: str
    approval_state: str | None
    policy_decision: str | None


@dataclass(frozen=True)
class ActionResult:
    action_id: str
    approved: bool

    @classmethod
    def from_mapping(cls, data: Mapping[str, Any]) -> "ActionResult":
        return cls(action_id=str(data.get("action_id", "")), approved=bool(data.get("approved")))


@dataclass(frozen=True)
class WorldModelEntity:
    entity_id: str
    name: str
    entity_type: str | None
    confidence: float | None
    raw: Mapping[str, Any]


@dataclass(frozen=True)
class WorldModelQuery:
    entity: Mapping[str, Any]
    observations: list[Mapping[str, Any]]
    observation_count: int
    effective_confidence: float | None
    raw: Mapping[str, Any]


@dataclass(frozen=True)
class RuntimeHealth:
    status: str
    version: str | None
    components: Mapping[str, Any]
    raw: Mapping[str, Any]
