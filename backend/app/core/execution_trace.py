"""Canonical append-only execution trace for AIOS/JARVIS replay."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Iterable, Optional

from app.core.execution_events import ExecutionEvent


@dataclass
class ExecutionTrace:
    """In-memory canonical event stream.

    Persistence is intentionally outside this primitive. The trace provides a
    single ordered contract that can later be persisted, streamed to telemetry,
    or consumed by ULTRON Replay without creating separate trace formats.
    """

    _events: list[ExecutionEvent] = field(default_factory=list)
    _lock: Lock = field(default_factory=Lock, repr=False, compare=False)

    def append(self, event: ExecutionEvent) -> None:
        if not event.event_id or not event.execution_id:
            raise ValueError("execution and event identifiers are required")
        with self._lock:
            if any(existing.event_id == event.event_id for existing in self._events):
                raise ValueError(f"duplicate event_id: {event.event_id}")
            if self._events and self._events[-1].execution_id != event.execution_id:
                raise ValueError("a trace cannot mix execution IDs")
            self._events.append(event)

    def snapshot(self) -> tuple[ExecutionEvent, ...]:
        with self._lock:
            return tuple(self._events)

    def for_execution(self, execution_id: str) -> tuple[ExecutionEvent, ...]:
        return tuple(event for event in self.snapshot() if event.execution_id == execution_id)

    def serialize(self) -> list[dict]:
        return [event.to_dict() for event in self.snapshot()]

    @classmethod
    def from_events(cls, events: Iterable[ExecutionEvent]) -> "ExecutionTrace":
        trace = cls()
        for event in events:
            trace.append(event)
        return trace

    @staticmethod
    def utc_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
