from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


class EventFabric:
    """Canonical in-process event boundary for the authoritative app runtime.

    Events are immutable dictionaries with IDs, timestamps and source metadata.
    The bounded history prevents an in-memory publisher from becoming an
    unbounded resource sink. This is intentionally transport-agnostic so a
    durable broker can replace the implementation later.
    """

    def __init__(self, max_history: int = 1000) -> None:
        if max_history < 1:
            raise ValueError("max_history must be positive")
        self._history: deque[dict[str, Any]] = deque(maxlen=max_history)
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._lock = asyncio.Lock()

    async def publish(
        self,
        event_type: str,
        payload: dict[str, Any] | None = None,
        *,
        source: str = "app",
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        event = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "source": source,
            "correlation_id": correlation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": dict(payload or {}),
        }
        async with self._lock:
            self._history.append(event)
            subscribers = tuple(self._subscribers)
        for queue in subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # A slow observer must not block or break the authoritative path.
                continue
        return event

    async def subscribe(self, max_queue: int = 100) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=max_queue)
        async with self._lock:
            self._subscribers.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        async with self._lock:
            self._subscribers.discard(queue)

    async def history(self, limit: int = 100) -> list[dict[str, Any]]:
        if limit < 1:
            raise ValueError("limit must be positive")
        async with self._lock:
            return list(self._history)[-limit:]


app_event_fabric = EventFabric()
