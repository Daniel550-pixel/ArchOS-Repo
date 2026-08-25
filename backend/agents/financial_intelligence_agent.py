"""Financial Intelligence specialist promoted from the FinSight capability family."""
from __future__ import annotations

from .base import Agent, AgentCapability, AgentTask, AgentResult, RealityLevel
from backend.intelligence.financial_intelligence import FinancialObservation, assess_market, aggregate_confidence


class FinancialIntelligenceAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            id="financial_intelligence",
            name="Financial Intelligence Specialist",
            description="Normalizes and assesses market observations using the promoted FinSight intelligence contract.",
            capabilities={AgentCapability.FINANCIAL_INTELLIGENCE},
            supported_tools=["finsight_assessment", "market_observation"],
            reality_default=RealityLevel.OBSERVED,
        )

    async def _run(self, task: AgentTask) -> AgentResult:
        raw = task.payload.get("market_data", [])
        observations: list[FinancialObservation] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            try:
                observations.append(FinancialObservation(
                    symbol=str(item.get("symbol", "")),
                    price=float(item.get("price", 0)),
                    volatility=float(item.get("volatility", 0)),
                    volume=float(item.get("volume", 0)),
                    trend=str(item.get("trend", "UNKNOWN")),
                    source=str(item.get("source", "finsight")),
                ))
            except (TypeError, ValueError):
                continue

        assessments = assess_market(observations)
        output = {
            "assessments": [item.to_dict() for item in assessments],
            "aggregate_confidence": aggregate_confidence(assessments),
            "observation_count": len(observations),
            "assessment_count": len(assessments),
            "authority": "ANALYTICAL_ONLY",
            "execution_authority": False,
        }
        return AgentResult(
            agent_id=self.id,
            task_id=task.task_id,
            status="SUCCESS",
            output=output,
            reality=RealityLevel.OBSERVED,
            confidence=output["aggregate_confidence"],
            provenance="archos:financial_intelligence:finsight-promoted",
        )
