import pytest

from app.core.execution_events import ExecutionEvent, ExecutionEventType
from app.core.execution_trace import ExecutionTrace


def event(event_id: str, execution_id: str = "execution-1") -> ExecutionEvent:
    return ExecutionEvent(
        event_id=event_id,
        execution_id=execution_id,
        event_type=ExecutionEventType.RESOURCE_DECISION,
        recorded_at="2026-08-25T16:00:00+00:00",
        payload={"accepted": True},
    )


def test_trace_preserves_event_order() -> None:
    trace = ExecutionTrace()
    trace.append(event("event-1"))
    trace.append(event("event-2"))

    assert [item.event_id for item in trace.snapshot()] == ["event-1", "event-2"]


def test_trace_rejects_duplicate_event_ids() -> None:
    trace = ExecutionTrace()
    trace.append(event("event-1"))

    with pytest.raises(ValueError, match="duplicate event_id"):
        trace.append(event("event-1"))


def test_trace_rejects_mixed_execution_ids() -> None:
    trace = ExecutionTrace()
    trace.append(event("event-1", "execution-1"))

    with pytest.raises(ValueError, match="cannot mix execution IDs"):
        trace.append(event("event-2", "execution-2"))


def test_trace_round_trips_from_events() -> None:
    original = ExecutionTrace.from_events([event("event-1"), event("event-2")])
    restored = ExecutionTrace.from_events(original.snapshot())

    assert restored.serialize() == original.serialize()
