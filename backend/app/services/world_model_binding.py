from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Entity, EntityStateVersion

_STOPWORDS = {
    "the", "a", "an", "by", "to", "of", "in", "on", "for", "from", "and",
    "what", "happens", "if", "change", "changes", "percent", "percentage", "until",
    "through", "with", "will", "would", "should", "could",
}


def _tokens(value: str) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9_]+", value.lower())
        if token not in _STOPWORDS and len(token) > 2
    }


@dataclass(frozen=True)
class BindingCandidate:
    entity_id: str
    entity_name: str
    metric: str
    score: float
    confidence: float
    current_value: Any
    provenance: list[dict[str, Any]]


class WorldModelBindingService:
    """Resolve scenario language to observed World Model entity/metric state."""

    async def resolve(
        self,
        session: AsyncSession,
        request: str,
        *,
        as_of=None,
        limit: int = 5,
    ) -> list[BindingCandidate]:
        entities = (await session.execute(
            select(Entity).order_by(Entity.mention_count.desc()).limit(2000)
        )).scalars().all()
        request_tokens = _tokens(request)
        if not request_tokens:
            return []

        candidates: list[BindingCandidate] = []

        for entity in entities:
            names = {entity.name, entity.canonical_name}
            aliases = entity.aliases if isinstance(entity.aliases, list) else []
            names.update(str(alias) for alias in aliases)
            entity_tokens = set().union(*(_tokens(name) for name in names)) if names else set()
            entity_score = len(request_tokens & entity_tokens) / max(1, len(request_tokens))
            if entity_score <= 0:
                continue

            state_query = select(EntityStateVersion).where(EntityStateVersion.entity_id == entity.entity_id)
            if as_of is None:
                state_query = state_query.where(EntityStateVersion.valid_until.is_(None))
            else:
                state_query = state_query.where(
                    EntityStateVersion.valid_from <= as_of,
                    (EntityStateVersion.valid_until.is_(None) | (EntityStateVersion.valid_until > as_of)),
                )
            state_query = state_query.order_by(EntityStateVersion.version.desc()).limit(1)
            state = (await session.execute(state_query)).scalar_one_or_none()
            if not state or not isinstance(state.state, dict):
                continue

            state_confidence = float(state.confidence if state.confidence is not None else 0.0)
            entity_confidence = float(entity.confidence if entity.confidence is not None else 0.0)
            provenance = {
                "entity_id": entity.entity_id,
                "entity_name": entity.name,
                "state_version": state.version,
                "state_confidence": state_confidence,
                "entity_confidence": entity_confidence,
                "source": "entity_state_versions",
            }

            for metric, value in state.state.items():
                metric_tokens = _tokens(str(metric))
                metric_score = len(request_tokens & metric_tokens) / max(1, len(request_tokens))
                combined = min(1.0, entity_score * 0.65 + metric_score * 0.35)
                if combined <= 0:
                    continue
                candidates.append(BindingCandidate(
                    entity_id=entity.entity_id,
                    entity_name=entity.name,
                    metric=str(metric),
                    score=combined,
                    confidence=min(1.0, combined * state_confidence * max(entity_confidence, 0.0)),
                    current_value=value,
                    provenance=[provenance],
                ))

        candidates.sort(key=lambda item: (item.score, item.confidence), reverse=True)
        return candidates[:limit]

    @staticmethod
    def choose(candidates: list[BindingCandidate], *, minimum_score: float = 0.35) -> BindingCandidate | None:
        if not candidates or candidates[0].score < minimum_score:
            return None
        if len(candidates) > 1 and abs(candidates[0].score - candidates[1].score) < 0.05:
            return None
        return candidates[0]

    @staticmethod
    def serialize(candidate: BindingCandidate | None) -> dict[str, Any] | None:
        return asdict(candidate) if candidate else None
