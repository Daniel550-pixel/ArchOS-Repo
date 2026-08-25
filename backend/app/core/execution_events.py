"""Canonical execution-event contract used by AIOS/JARVIS replay."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Mapping, Optional


class ExecutionEventType(str, Enum):
    RESOURCE_DECISION = "resource_decision"


@dataclass(frozen=True)
class ExecutionEvent:
    event_id: str
    execution_id: str
    event_type: ExecutionEventType
    recorded_at: str
    payload: Mapping[str, Any]
    parent_event_id: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "execution_id": self.execution_id,
            "event_type": self.event_type.value,
            "recorded_at": self.recorded_at,
            "payload": dict(self.payload),
            "parent_event_id": self.parent_event_id,
        }
