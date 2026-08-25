"""Canonical replay event for resource-aware AIOS execution decisions."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Mapping, Optional

from app.core.execution_events import ExecutionEvent, ExecutionEventType
from app.core.resource_execution import ExecutionMode, ResourceDecision


@dataclass(frozen=True)
class ResourceExecutionTrace:
    """Structured payload retained for replay and surfaced as an execution event."""

    execution_id: str
    workload_id: str
    recorded_at: str
    memory_available_bytes: int
    memory_required_bytes: int
    compute_available_units: float
    compute_required_units: float
    selected_mode: Optional[str]
    selected_resource_class: Optional[str]
    accepted: bool
    decision_reason: str
    strategy_reason: Optional[str]

    @classmethod
    def from_decision(
        cls,
        *,
        execution_id: str,
        workload_id: str,
        decision: ResourceDecision,
        memory_available_bytes: int,
        memory_required_bytes: int,
        compute_available_units: float,
        compute_required_units: float,
        recorded_at: Optional[str] = None,
    ) -> "ResourceExecutionTrace":
        strategy = decision.strategy
        return cls(
            execution_id=execution_id,
            workload_id=workload_id,
            recorded_at=recorded_at or datetime.now(timezone.utc).isoformat(),
            memory_available_bytes=memory_available_bytes,
            memory_required_bytes=memory_required_bytes,
            compute_available_units=compute_available_units,
            compute_required_units=compute_required_units,
            selected_mode=strategy.mode.value if strategy else None,
            selected_resource_class=strategy.selected_resource_class if strategy else None,
            accepted=decision.accepted,
            decision_reason=decision.reason,
            strategy_reason=strategy.reason if strategy else None,
        )

    def to_dict(self) -> Mapping[str, Any]:
        return asdict(self)

    def to_execution_event(
        self,
        *,
        event_id: str,
        parent_event_id: Optional[str] = None,
    ) -> ExecutionEvent:
        return ExecutionEvent(
            event_id=event_id,
            execution_id=self.execution_id,
            event_type=ExecutionEventType.RESOURCE_DECISION,
            recorded_at=self.recorded_at,
            payload=self.to_dict(),
            parent_event_id=parent_event_id,
        )

    @property
    def replayable_mode(self) -> Optional[ExecutionMode]:
        if self.selected_mode is None:
            return None
        return ExecutionMode(self.selected_mode)
