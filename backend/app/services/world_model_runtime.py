from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.database import Entity
from app.services.world_model_reasoning import WorldModelReasoningService


reasoning = WorldModelReasoningService()


async def query_authoritative_state(detected_entities: list[dict[str, Any]]) -> Dict[str, Any]:
    """Resolve J.A.R.V.I.S. entities against PostgreSQL before reasoning."""
    result: Dict[str, Any] = {
        "queried_nodes": [],
        "current_state": {},
        "temporal_events": [],
        "missing_attributes": [],
        "source": "postgresql_temporal_world_model",
    }

    async with AsyncSessionLocal() as session:
        for item in detected_entities:
            name = str(item.get("name", "")).strip()
            urn = str(item.get("urn", ""))
            result["queried_nodes"].append(urn or name)
            if not name:
                result["missing_attributes"].append({"urn": urn, "reason": "ENTITY_NAME_MISSING"})
                continue

            entity_result = await session.execute(
                select(Entity)
                .where(Entity.name.ilike(name))
                .limit(1)
            )
            entity = entity_result.scalar_one_or_none()
            if not entity:
                result["missing_attributes"].append({
                    "urn": urn,
                    "name": name,
                    "reason": "ENTITY_NOT_PERSISTED",
                })
                continue

            state = await reasoning.entity_state(session, entity.entity_id)
            result["current_state"][entity.canonical_name] = state or {
                "entity_id": entity.entity_id,
                "name": entity.name,
                "state": {},
                "state_version": None,
                "evidence": [],
            }

    return result
