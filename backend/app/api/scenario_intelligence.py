from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.scenario_intelligence import CausalRule, ScenarioIntelligence

router = APIRouter(prefix="/api/simulation/intelligence", tags=["simulation-intelligence"])


class RuleInput(BaseModel):
    source: str
    target: str
    coefficient: float
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    rationale: str = ""


class PropagationRequest(BaseModel):
    baseline: Dict[str, Dict[str, Any]]
    scenario: Dict[str, Dict[str, Any]]
    rules: List[RuleInput] = Field(default_factory=list)


@router.post("/propagate")
async def propagate(request: PropagationRequest):
    engine = ScenarioIntelligence([
        CausalRule(
            source=rule.source,
            target=rule.target,
            coefficient=rule.coefficient,
            confidence=rule.confidence,
            rationale=rule.rationale,
        )
        for rule in request.rules
    ])
    return engine.propagate(request.baseline, request.scenario)
