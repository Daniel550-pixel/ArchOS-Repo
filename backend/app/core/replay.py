"""Deterministic replay primitives built on the canonical execution trace."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Optional

from app.core.execution_events import ExecutionEvent
from app.core.execution_trace import ExecutionTrace


@dataclass(frozen=True)
class ReplayState:
    execution_id: str
    cursor: int
    state: Mapping[str, Any]


@dataclass(frozen=True)
class ReplayDivergence:
    event_index: int
    event_id: str
    expected: Any
    actual: Any
    reason: str


@dataclass(frozen=True)
class ReplayResult:
    execution_id: str
    events_replayed: int
    final_state: Mapping[str, Any]
    divergence: Optional[ReplayDivergence]

    @property
    def deterministic(self) -> bool:
        return self.divergence is None


Reducer = Callable[[Mapping[str, Any], ExecutionEvent], Mapping[str, Any]]


def replay(
    trace: ExecutionTrace,
    execution_id: str,
    reducer: Reducer,
    *,
    initial_state: Optional[Mapping[str, Any]] = None,
) -> ReplayResult:
    """Reconstruct state by applying canonical events in recorded order."""
    events = trace.for_execution(execution_id)
    state: Mapping[str, Any] = dict(initial_state or {})

    for index, event in enumerate(events):
        try:
            next_state = reducer(state, event)
        except Exception as exc:  # replay must return a structured failure
            return ReplayResult(
                execution_id=execution_id,
                events_replayed=index,
                final_state=state,
                divergence=ReplayDivergence(
                    event_index=index,
                    event_id=event.event_id,
                    expected="successful state transition",
                    actual=type(exc).__name__,
                    reason=str(exc),
                ),
            )
        if not isinstance(next_state, Mapping):
            return ReplayResult(
                execution_id=execution_id,
                events_replayed=index,
                final_state=state,
                divergence=ReplayDivergence(
                    event_index=index,
                    event_id=event.event_id,
                    expected="Mapping state",
                    actual=type(next_state).__name__,
                    reason="reducer returned an invalid state object",
                ),
            )
        state = dict(next_state)

    return ReplayResult(
        execution_id=execution_id,
        events_replayed=len(events),
        final_state=state,
        divergence=None,
    )
