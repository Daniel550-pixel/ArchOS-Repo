"""Resource-aware execution contracts for AIOS/JARVIS.

This module is deliberately policy-neutral: it plans execution from explicit
resource facts, but it never authorizes or executes work itself.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import FrozenSet, Optional


class ExecutionMode(str, Enum):
    RESIDENT = "resident"
    PARTIAL = "partial"
    STREAMED = "streamed"
    REMOTE = "remote"
    FALLBACK = "fallback"


@dataclass(frozen=True)
class ResourceProfile:
    memory_required_bytes: int
    compute_required_units: float
    storage_bandwidth_required_bytes_per_second: int = 0
    latency_target_ms: Optional[int] = None
    required_capabilities: FrozenSet[str] = frozenset()
    allow_streaming: bool = True
    allow_remote: bool = True
    allow_fallback: bool = True

    def __post_init__(self) -> None:
        if self.memory_required_bytes < 0:
            raise ValueError("memory_required_bytes must be non-negative")
        if self.compute_required_units < 0:
            raise ValueError("compute_required_units must be non-negative")
        if self.storage_bandwidth_required_bytes_per_second < 0:
            raise ValueError("storage_bandwidth_required_bytes_per_second must be non-negative")
        if self.latency_target_ms is not None and self.latency_target_ms < 0:
            raise ValueError("latency_target_ms must be non-negative")


@dataclass(frozen=True)
class ResourceSnapshot:
    available_memory_bytes: int
    available_compute_units: float
    available_storage_bandwidth_bytes_per_second: int = 0
    available_capabilities: FrozenSet[str] = frozenset()
    remote_available: bool = False

    def __post_init__(self) -> None:
        if self.available_memory_bytes < 0:
            raise ValueError("available_memory_bytes must be non-negative")
        if self.available_compute_units < 0:
            raise ValueError("available_compute_units must be non-negative")
        if self.available_storage_bandwidth_bytes_per_second < 0:
            raise ValueError("available_storage_bandwidth_bytes_per_second must be non-negative")


@dataclass(frozen=True)
class ExecutionStrategy:
    mode: ExecutionMode
    memory_budget_bytes: int
    estimated_working_set_bytes: int
    selected_resource_class: str
    reason: str


@dataclass(frozen=True)
class ResourceDecision:
    accepted: bool
    strategy: Optional[ExecutionStrategy]
    reason: str


def plan_execution(profile: ResourceProfile, snapshot: ResourceSnapshot) -> ResourceDecision:
    """Select the least expensive valid local strategy without implicit fallback.

    Authorization remains outside this function. A remote or fallback strategy is
    only considered when explicitly allowed by the workload profile.
    """

    missing_capabilities = profile.required_capabilities - snapshot.available_capabilities
    if missing_capabilities:
        if profile.allow_remote and snapshot.remote_available:
            return ResourceDecision(
                True,
                ExecutionStrategy(
                    ExecutionMode.REMOTE,
                    0,
                    0,
                    "remote",
                    f"missing capabilities delegated remotely: {sorted(missing_capabilities)}",
                ),
                "local capability set is insufficient",
            )
        if profile.allow_fallback:
            return ResourceDecision(
                True,
                ExecutionStrategy(
                    ExecutionMode.FALLBACK,
                    0,
                    0,
                    "fallback",
                    f"fallback required for missing capabilities: {sorted(missing_capabilities)}",
                ),
                "local capability set is insufficient",
            )
        return ResourceDecision(False, None, f"missing required capabilities: {sorted(missing_capabilities)}")

    enough_compute = snapshot.available_compute_units >= profile.compute_required_units
    enough_memory = snapshot.available_memory_bytes >= profile.memory_required_bytes
    enough_bandwidth = (
        snapshot.available_storage_bandwidth_bytes_per_second
        >= profile.storage_bandwidth_required_bytes_per_second
    )

    if enough_memory and enough_compute and enough_bandwidth:
        return ResourceDecision(
            True,
            ExecutionStrategy(
                ExecutionMode.RESIDENT,
                profile.memory_required_bytes,
                profile.memory_required_bytes,
                "resident",
                "all declared resource requirements are available",
            ),
            "resident execution is feasible",
        )

    if profile.allow_streaming and enough_compute:
        minimum_stream_memory = min(profile.memory_required_bytes, snapshot.available_memory_bytes)
        if minimum_stream_memory > 0 and snapshot.available_storage_bandwidth_bytes_per_second > 0:
            return ResourceDecision(
                True,
                ExecutionStrategy(
                    ExecutionMode.STREAMED,
                    snapshot.available_memory_bytes,
                    minimum_stream_memory,
                    "streamed",
                    "resident execution exceeds the available memory budget",
                ),
                "streaming is explicitly permitted and storage bandwidth is available",
            )

    if profile.allow_remote and snapshot.remote_available:
        return ResourceDecision(
            True,
            ExecutionStrategy(
                ExecutionMode.REMOTE,
                0,
                0,
                "remote",
                "local resource budget is insufficient",
            ),
            "remote execution is explicitly permitted",
        )

    if profile.allow_fallback:
        return ResourceDecision(
            True,
            ExecutionStrategy(
                ExecutionMode.FALLBACK,
                0,
                0,
                "fallback",
                "local resource budget is insufficient",
            ),
            "fallback execution is explicitly permitted",
        )

    return ResourceDecision(False, None, "no permitted execution strategy satisfies the resource budget")
