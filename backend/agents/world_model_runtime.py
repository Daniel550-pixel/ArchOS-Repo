from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.services.world_model_reasoning import WorldModelReasoningService


class WorldModelRuntime:
    """Read-only runtime boundary used by the J.A.R.V.I.S. World Model stage."""

    def __init__(self) -> None:
        self.reasoning = WorldModelReasoningService()

    async def query(
        self,
        session: AsyncSession,
        detected_entities: list[dict[str, Any]],
        *,
        at: Optional[datetime] = None,
        include_history: bool = False,
        history_start: Optional[datetime] = None,
        history_end: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        nodes: list[str] = []
        current_state: dict[str, Any] = {}
        temporal_events: list[dict[str, Any]] = []
        missing_attributes: list[str] = []
        evidence: list[dict[str, Any]] = []

        for entity in detected_entities:
            entity_id = str(entity.get("urn") or entity.get("entity_id") or "").strip()
            if not entity_id:
                missing_attributes.append("entity_id")
                continue

            nodes.append(entity_id)
            snapshot = await self.reasoning.entity_state(session, entity_id, at=at)
            if snapshot is None:
                missing_attributes.append(entity_id)
                continue

            current_state[entity_id] = snapshot
            evidence.extend(snapshot.get("evidence", []))

            if include_history:
                subject_type = str(entity.get("type") or "ENTITY")
                history = await self.reasoning.observations(
                    session,
                    subject_type=subject_type,
                    subject_id=entity_id,
                    start=history_start,
                    end=history_end,
                )
                temporal_events.extend(history)

        confidence_values = [
            float(snapshot.get("confidence", 0.0))
            for snapshot in current_state.values()
            if snapshot.get("confidence") is not None
        ]

        return {
            "queried_nodes": nodes,
            "current_state": current_state,
            "temporal_events": temporal_events,
            "missing_attributes": missing_attributes,
            "evidence": evidence,
            "reality": "OBSERVED",
            "confidence": min(confidence_values) if confidence_values else 0.0,
            "provenance": "postgresql:temporal_world_model",
            "query": {
                "at": at.isoformat() if at else None,
                "include_history": include_history,
                "history_start": history_start.isoformat() if history_start else None,
                "history_end": history_end.isoformat() if history_end else None,
            },
        }


async def query_authoritative_state(
    detected_entities: list[dict[str, Any]],
    *,
    at: Optional[datetime] = None,
    include_history: bool = False,
    history_start: Optional[datetime] = None,
    history_end: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Convenience boundary for agents that do not own a request-scoped DB session.

    The function deliberately creates a short-lived read-only session and delegates
    to ``WorldModelRuntime`` so all World Model access follows one implementation.
    """
    async with AsyncSessionLocal() as session:
        runtime = WorldModelRuntime()
        return await runtime.query(
            session,
            detected_entities,
            at=at,
            include_history=include_history,
            history_start=history_start,
            history_end=history_end,
        )
