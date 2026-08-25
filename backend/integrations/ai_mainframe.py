from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class MainframeCapability:
    name: str
    domain: str
    description: str
    execution_mode: str = "governed"
    status: str = "available"


class MainframeRuntime:
    """ArchOS-native mainframe capability registry.

    This module is descriptive and orchestration-facing only. Consequential
    execution must continue through ArchOS governance and ActionGate.
    """

    def __init__(self) -> None:
        self._capabilities = (
            MainframeCapability(
                "orchestration",
                "core",
                "Coordinate registered intelligence workloads through ArchOS JARVIS.",
            ),
            MainframeCapability(
                "state-observation",
                "core",
                "Expose authoritative system observations for downstream reasoning.",
            ),
            MainframeCapability(
                "event-routing",
                "core",
                "Route capability events through the ArchOS event fabric.",
            ),
            MainframeCapability(
                "governed-action",
                "security",
                "Submit consequential operations to ArchOS ActionGate and policy controls.",
            ),
        )

    def capabilities(self) -> list[dict[str, Any]]:
        return [asdict(item) for item in self._capabilities]

    def capability(self, name: str) -> dict[str, Any] | None:
        for item in self._capabilities:
            if item.name == name:
                return asdict(item)
        return None


mainframe_runtime = MainframeRuntime()
