from app.core.execution_events import ExecutionEvent, ExecutionEventType
from app.core.execution_trace import ExecutionTrace
from app.core.replay import replay


def make_event(event_id: str, value: int) -> ExecutionEvent:
    return ExecutionEvent(
        event_id=event_id,
        execution_id="execution-1",
        event_type=ExecutionEventType.RESOURCE_DECISION,
        recorded_at="2026-08-25T16:00:00+00:00",
        payload={"value": value},
    )


def reducer(state: dict, event: ExecutionEvent) -> dict:
    return {"total": state.get("total", 0) + event.payload["value"]}


def test_replay_reconstructs_state_deterministically() -> None:
    trace = ExecutionTrace.from_events([
        make_event("event-1", 2),
        make_event("event-2", 3),
    ])

    result = replay(trace, "execution-1", reducer)

    assert result.deterministic
    assert result.events_replayed == 2
    assert result.final_state == {"total": 5}


def test_replay_is_repeatable() -> None:
    trace = ExecutionTrace.from_events([
        make_event("event-1", 2),
        make_event("event-2", 3),
    ])

    first = replay(trace, "execution-1", reducer)
    second = replay(trace, "execution-1", reducer)

    assert first.final_state == second.final_state
    assert first.events_replayed == second.events_replayed


def test_replay_returns_structured_divergence() -> None:
    trace = ExecutionTrace.from_events([make_event("event-1", 2)])

    def broken_reducer(state: dict, event: ExecutionEvent) -> dict:
        raise RuntimeError("simulated replay failure")

    result = replay(trace, "execution-1", broken_reducer)

    assert not result.deterministic
    assert result.divergence is not None
    assert result.divergence.event_id == "event-1"
    assert result.divergence.reason == "simulated replay failure"
