"""Small, dependency-free response models used by the ArchOS SDK."""

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
