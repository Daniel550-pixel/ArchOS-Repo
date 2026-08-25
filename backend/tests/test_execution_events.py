from app.core.execution_events import ExecutionEvent, ExecutionEventType


def test_execution_event_serializes_canonical_type() -> None:
    event = ExecutionEvent(
        event_id="event-1",
        execution_id="execution-1",
        event_type=ExecutionEventType.RESOURCE_DECISION,
        recorded_at="2026-08-25T16:00:00+00:00",
        payload={"accepted": True},
    )

    assert event.to_dict() == {
        "event_id": "event-1",
        "execution_id": "execution-1",
        "event_type": "resource_decision",
        "recorded_at": "2026-08-25T16:00:00+00:00",
        "payload": {"accepted": True},
        "parent_event_id": None,
    }
