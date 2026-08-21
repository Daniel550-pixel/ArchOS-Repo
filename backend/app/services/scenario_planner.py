from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict


@dataclass(frozen=True)
class ScenarioPlan:
    objective: str
    assumptions: Dict[str, Any]
    horizon: datetime
    confidence: float
    requires_confirmation: bool
    rationale: str


class ScenarioPlanner:
    """Converts constrained natural-language scenario requests into auditable plans.

    This layer deliberately does not execute a scenario or mutate the World Model.
    """

    YEAR_PATTERN = re.compile(r"\b(20\d{2})\b")
    PERCENT_PATTERN = re.compile(r"([+-]?\d+(?:\.\d+)?)\s*%")

    def plan(self, request: str, *, now: datetime) -> ScenarioPlan:
        text = request.strip()
        if not text:
            raise ValueError("Scenario request cannot be empty")

        years = [int(match.group(1)) for match in self.YEAR_PATTERN.finditer(text)]
        horizon_year = years[-1] if years else now.year + 5
        if horizon_year <= now.year:
            raise ValueError("Scenario horizon must be in the future")
        if horizon_year > now.year + 100:
            raise ValueError("Scenario horizon exceeds the supported 100-year planning window")

        percentages = [float(match.group(1)) for match in self.PERCENT_PATTERN.finditer(text)]
        assumptions: Dict[str, Any] = {
            "requested_change_percentages": percentages,
            "source_request": text,
        }

        requires_confirmation = not bool(percentages)
        confidence = 0.85 if percentages else 0.35
        rationale = (
            "Parsed explicit percentage assumption and future horizon."
            if percentages
            else "No explicit quantitative assumption was detected; human confirmation is required."
        )

        horizon = now.replace(year=horizon_year)
        return ScenarioPlan(
            objective=text,
            assumptions=assumptions,
            horizon=horizon,
            confidence=confidence,
            requires_confirmation=requires_confirmation,
            rationale=rationale,
        )
