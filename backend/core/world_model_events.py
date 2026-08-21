"""Event-sourced reality. Append-only truth + fold-to-now projection + time travel."""
import uuid
from collections import deque
from datetime import datetime, timezone

from .db import Base, SessionLocal
from .world_model import WorldEntity
from app.services.event_fabric import app_event_fabric as fabric

# Bounded local history for compatibility and deterministic time-travel tests.
_MEM_EVENTS = deque(maxlen=1000)

try:
    from sqlalchemy import Column, String, Float, Text, DateTime
    from sqlalchemy.types import JSON

    class WorldEvent(Base):
        __tablename__ = "world_model_events"
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        entity_id = Column(String, index=True)
        tenant_id = Column(String, index=True)
        ts = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
        actor = Column(Text)
        event_type = Column(String)
        patch = Column(JSON)
        reality = Column(String, default="OBSERVED")
        confidence = Column(Float, default=1.0)
        provenance = Column(Text)
except Exception:
    class WorldEvent:
        pass


async def append(
    entity_id,
    tenant,
    actor,
    patch,
    event_type="STATE_CHANGED",
    reality="OBSERVED",
    confidence=1.0,
    provenance="",
):
    event_record = {
        "id": str(uuid.uuid4()),
        "entity_id": str(entity_id),
        "tenant_id": str(tenant),
        "ts": datetime.now(timezone.utc),
        "actor": actor,
        "event_type": event_type,
        "patch": patch,
        "reality": reality,
        "confidence": confidence,
        "provenance": provenance,
    }
    _MEM_EVENTS.append(event_record)

    if SessionLocal:
        try:
            with SessionLocal() as db:
                db.add(
                    WorldEvent(
                        id=event_record["id"],
                        entity_id=event_record["entity_id"],
                        tenant_id=event_record["tenant_id"],
                        actor=actor,
                        event_type=event_type,
                        patch=patch,
                        reality=reality,
                        confidence=confidence,
                        provenance=provenance,
                    )
                )
                ent = db.get(WorldEntity, entity_id)
                if ent:
                    ent.state_current = {**(ent.state_current or {}), **patch}
                db.commit()
        except Exception:
            pass

    try:
        await fabric.publish(
            "WORLD_MODEL_EVENT",
            {
                "entity_id": str(entity_id),
                "event_type": event_type,
                "reality": reality,
                "confidence": confidence,
                "patch": patch,
            },
            source="world_model_events",
        )
    except Exception:
        pass

    return event_record


def fold_to_now(entity_id: str) -> dict:
    events = [e for e in _MEM_EVENTS if e["entity_id"] == entity_id]
    state = {}
    for ev in sorted(events, key=lambda x: x["ts"]):
        if isinstance(ev.get("patch"), dict):
            state.update(ev["patch"])
    return state


def history(entity_id: str) -> list:
    return [
        {
            **e,
            "ts": e["ts"].isoformat() if hasattr(e["ts"], "isoformat") else str(e["ts"]),
        }
        for e in _MEM_EVENTS
        if e["entity_id"] == entity_id
    ]


def as_of(entity_id: str, ts_point: datetime) -> dict:
    events = [
        e
        for e in _MEM_EVENTS
        if e["entity_id"] == entity_id and e["ts"] <= ts_point
    ]
    state = {}
    for ev in sorted(events, key=lambda x: x["ts"]):
        if isinstance(ev.get("patch"), dict):
            state.update(ev["patch"])
    return state
