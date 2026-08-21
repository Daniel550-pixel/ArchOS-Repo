from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.world_model_reasoning import WorldModelReasoningService


class WorldModelRuntime:
    """Read-only runtime boundary used by the J.A.R.V.I.S. World Model stage."""

    def __init__(self) -> None:
        self.reasoning = WorldModelReasoningService()

    async def query(self, session: AsyncSession, detected_entities: list[dict[str, Any]]) -> Dict[str, Any]:
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
            snapshot = await self.reasoning.get_entity_state(session, entity_id)
            if snapshot is None:
                missing_attributes.append(entity_id)
                continue

            current_state[entity_id] = snapshot
            evidence.extend(snapshot.get("evidence", []))

        return {
            "queried_nodes": nodes,
            "current_state": current_state,
            "temporal_events": temporal_events,
            "missing_attributes": missing_attributes,
            "evidence": evidence,
            "reality": "OBSERVED",
            "provenance": "postgresql:temporal_world_model",
        }
