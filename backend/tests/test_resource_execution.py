from __future__ import annotations

import pytest

from app.core.resource_execution import (
    ExecutionMode,
    ResourceProfile,
    ResourceSnapshot,
    plan_execution,
)


def snapshot(**overrides: object) -> ResourceSnapshot:
    values = {
        "available_memory_bytes": 16_000,
        "available_compute_units": 100.0,
        "available_storage_bandwidth_bytes_per_second": 10_000,
        "available_capabilities": frozenset({"vision", "reasoning"}),
        "remote_available": False,
    }
    values.update(overrides)
    return ResourceSnapshot(**values)


def test_selects_resident_when_budget_is_sufficient() -> None:
    decision = plan_execution(
        ResourceProfile(memory_required_bytes=8_000, compute_required_units=50),
        snapshot(),
    )

    assert decision.accepted
    assert decision.strategy is not None
    assert decision.strategy.mode is ExecutionMode.RESIDENT


def test_selects_streaming_when_memory_is_the_bottleneck() -> None:
    decision = plan_execution(
        ResourceProfile(
            memory_required_bytes=32_000,
            compute_required_units=50,
            storage_bandwidth_required_bytes_per_second=1_000,
            allow_streaming=True,
        ),
        snapshot(available_memory_bytes=8_000),
    )

    assert decision.accepted
    assert decision.strategy is not None
    assert decision.strategy.mode is ExecutionMode.STREAMED
    assert decision.strategy.memory_budget_bytes == 8_000


def test_missing_capability_fails_closed_without_fallback() -> None:
    decision = plan_execution(
        ResourceProfile(
            memory_required_bytes=1_000,
            compute_required_units=1,
            required_capabilities=frozenset({"quantum"}),
            allow_remote=False,
            allow_fallback=False,
        ),
        snapshot(),
    )

    assert not decision.accepted
    assert decision.strategy is None
    assert "quantum" in decision.reason


def test_remote_is_explicit() -> None:
    decision = plan_execution(
        ResourceProfile(
            memory_required_bytes=100_000,
            compute_required_units=1,
            allow_streaming=False,
            allow_remote=True,
            allow_fallback=False,
        ),
        snapshot(remote_available=True),
    )

    assert decision.accepted
    assert decision.strategy is not None
    assert decision.strategy.mode is ExecutionMode.REMOTE


def test_invalid_resource_profile_is_rejected() -> None:
    with pytest.raises(ValueError):
        ResourceProfile(memory_required_bytes=-1, compute_required_units=1)
