from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.causal_graph import CausalGraphService

router = APIRouter(prefix="/api/simulation/causal-graph", tags=["causal-graph"])
_service = CausalGraphService()


async def get_db() -> AsyncSession:
    from app.core.database import get_db_session
    async for session in get_db_session():
        yield session


class RelationshipRequest(BaseModel):
    source: str
    target: str
    coefficient: float
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    rationale: str = ""
    valid_from: datetime
    valid_until: datetime | None = None
    provenance: str = ""
    relationship_type: str = "CAUSAL"


class PropagationRequest(BaseModel):
    direct_deltas: dict[str, float]
    as_of: datetime
    max_depth: int = Field(default=4, ge=1, le=10)
    max_nodes: int = Field(default=500, ge=1, le=5000)


@router.post("/relationships")
async def add_relationship(request: RelationshipRequest, session: AsyncSession = Depends(get_db)):
    try:
        row = await _service.add_relationship(session, **request.model_dump())
        await session.commit()
        return {"relationship_id": row.relationship_id, "status": "ACTIVE"}
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/propagate")
async def propagate(request: PropagationRequest, session: AsyncSession = Depends(get_db)):
    try:
        return await _service.propagate(
            session,
            request.direct_deltas,
            as_of=request.as_of,
            max_depth=request.max_depth,
            max_nodes=request.max_nodes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
