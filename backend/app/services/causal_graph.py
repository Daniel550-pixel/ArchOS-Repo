from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.causal_graph import CausalRelationship


class CausalGraphService:
    """Temporal, auditable causal graph with bounded traversal."""

    async def add_relationship(
        self,
        session: AsyncSession,
        *,
        source: str,
        target: str,
        coefficient: float,
        confidence: float,
        rationale: str,
        valid_from: datetime,
        valid_until: datetime | None = None,
        provenance: str = "",
        relationship_type: str = "CAUSAL",
    ) -> CausalRelationship:
        if source == target:
            raise ValueError("Self-referential causal relationships are not allowed")
        if valid_until is not None and valid_until <= valid_from:
            raise ValueError("valid_until must be later than valid_from")
        row = CausalRelationship(
            relationship_id=str(uuid4()), source=source, target=target,
            relationship_type=relationship_type, coefficient=coefficient,
            confidence=max(0.0, min(1.0, confidence)), rationale=rationale,
            valid_from=valid_from, valid_until=valid_until,
            provenance=provenance,
        )
        session.add(row)
        await session.flush()
        return row

    async def propagate(
        self,
        session: AsyncSession,
        direct_deltas: dict[str, float],
        *,
        as_of: datetime,
        max_depth: int = 4,
        max_nodes: int = 500,
    ) -> dict[str, Any]:
        if max_depth < 1 or max_depth > 10:
            raise ValueError("max_depth must be between 1 and 10")
        if max_nodes < 1 or max_nodes > 5000:
            raise ValueError("max_nodes must be between 1 and 5000")

        frontier = dict(direct_deltas)
        propagated: dict[str, float] = {}
        paths: list[dict[str, Any]] = []
        visited_edges: set[tuple[str, str]] = set()
        confidence_values: list[float] = []
        visited_nodes = set(frontier)

        for depth in range(max_depth):
            if not frontier or len(visited_nodes) >= max_nodes:
                break
            next_frontier: dict[str, float] = {}
            sources = list(frontier.items())
            for source, source_delta in sources:
                result = await session.execute(
                    select(CausalRelationship).where(
                        CausalRelationship.active.is_(True),
                        CausalRelationship.source == source,
                        CausalRelationship.valid_from <= as_of,
                        (CausalRelationship.valid_until.is_(None) | (CausalRelationship.valid_until > as_of)),
                    )
                )
                for edge in result.scalars().all():
                    key = (edge.source, edge.target)
                    if key in visited_edges or edge.target in visited_nodes:
                        continue
                    visited_edges.add(key)
                    effect = source_delta * edge.coefficient
                    propagated[edge.target] = propagated.get(edge.target, 0.0) + effect
                    next_frontier[edge.target] = next_frontier.get(edge.target, 0.0) + effect
                    visited_nodes.add(edge.target)
                    confidence_values.append(edge.confidence)
                    paths.append({
                        "depth": depth + 1,
                        "source": edge.source,
                        "target": edge.target,
                        "coefficient": edge.coefficient,
                        "effect": effect,
                        "confidence": edge.confidence,
                        "rationale": edge.rationale,
                        "provenance": edge.provenance,
                    })
                    if len(visited_nodes) >= max_nodes:
                        break
                if len(visited_nodes) >= max_nodes:
                    break
            frontier = next_frontier

        confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0.0
        return {
            "direct_deltas": direct_deltas,
            "propagated_effects": propagated,
            "paths": paths,
            "confidence": confidence,
            "nodes_visited": len(visited_nodes),
            "max_depth": max_depth,
        }
