"""Realtime event gateway for ULTRON projections.

This component is intentionally the realtime transport, not the authoritative
durable event store. Durable persistence must be added behind the publish
boundary before events are treated as replayable system-of-record data.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4


class EventFabric:
    def __init__(self):
        self.sockets: List[Any] = []
        self.sequence: int = 0

    async def connect(self, ws: Any):
        if hasattr(ws, "accept"):
            await ws.accept()
        if ws not in self.sockets:
            self.sockets.append(ws)

    async def disconnect(self, ws: Any):
        if ws in self.sockets:
            self.sockets.remove(ws)

    async def publish(self, event: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.sequence += 1
        envelope = {
            "event_id": str(uuid4()),
            "sequence": self.sequence,
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        msg = json.dumps(envelope, default=str, separators=(",", ":"))

        stale = []
        for ws in list(self.sockets):
            try:
                if hasattr(ws, "send_text"):
                    await ws.send_text(msg)
            except Exception:
                stale.append(ws)

        for ws in stale:
            await self.disconnect(ws)

        return envelope


fabric = EventFabric()
