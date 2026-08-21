import hashlib
import json
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import DurableEvent


async def append_event(
    session: AsyncSession,
    event_type: str,
    producer: str,
    payload: dict[str, Any],
    correlation_id: Optional[str] = None,
    causation_id: Optional[str] = None,
) -> DurableEvent:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    payload_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    current_max = await session.scalar(select(func.max(DurableEvent.sequence)))
    sequence = (current_max or 0) + 1

    event = DurableEvent(
        event_id=str(uuid4()),
        sequence=sequence,
        event_type=event_type,
        occurred_at=datetime.utcnow(),
        producer=producer,
        correlation_id=correlation_id,
        causation_id=causation_id,
        payload=payload,
        payload_hash=payload_hash,
    )
    session.add(event)
    await session.flush()
    return event


async def replay_events(
    session: AsyncSession,
    after_sequence: int = 0,
    limit: int = 100,
) -> list[DurableEvent]:
    result = await session.scalars(
        select(DurableEvent)
        .where(DurableEvent.sequence > after_sequence)
        .order_by(DurableEvent.sequence.asc())
        .limit(limit)
    )
    return list(result)
