"""Source→Bus→WorldModel→Cascade→Twin→ULTRON over WSS."""
import json
from typing import List, Any

try:
    from fastapi import WebSocket
except ImportError:
    WebSocket = Any

class EventFabric:
    def __init__(self):
        self.sockets: List[Any] = []

    async def connect(self, ws: Any):
        if hasattr(ws, "accept"):
            await ws.accept()
        self.sockets.append(ws)

    async def publish(self, event: str, payload: dict):
        msg = json.dumps({"event": event, "payload": payload})
        for ws in list(self.sockets):
            try:
                if hasattr(ws, "send_text"):
                    await ws.send_text(msg)
            except Exception:
                if ws in self.sockets:
                    self.sockets.remove(ws)

fabric = EventFabric()
