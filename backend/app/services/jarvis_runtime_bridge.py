from __future__ import annotations

from typing import Any

from backend.jarvis.runtime import run as legacy_run


class JarvisRuntimeBridge:
    """Controlled adapter from the legacy JARVIS runtime into the app runtime.

    The legacy runtime remains an implementation dependency; this adapter is the
    only app-layer boundary that imports it. Future migration can replace the
    implementation without changing API consumers.
    """

    async def run(self, query: dict[str, Any]) -> dict[str, Any]:
        return await legacy_run(query)


jarvis_runtime_bridge = JarvisRuntimeBridge()
