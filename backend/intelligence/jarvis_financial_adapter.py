"""FGSE JARVIS decision shape adapted to ArchOS specialist-agent results."""
from __future__ import annotations
from typing import Any
from backend.agents.base import AgentResult, RealityLevel

def normalize_jarvis_decision(agent_id: str, task_id: str, decision: dict[str, Any]) -> AgentResult:
    """Normalize external JARVIS output without granting execution authority."""
    confidence = max(0.0, min(1.0, float(decision.get("confidence", 0.0))))
    risk = max(0.0, min(1.0, float(decision.get("risk", 1.0))))
    status = str(decision.get("status", "REJECT")).upper()
    if status not in {"EXECUTE", "REJECT", "HALT"}: status = "REJECT"
    return AgentResult(agent_id=agent_id, task_id=task_id, status=status, output={"symbol": decision.get("symbol", "NONE"), "action": decision.get("action", "HOLD"), "decision_score": decision.get("decision_score", 0.0), "capital_allocation": decision.get("capital_allocation", 0.0), "agent_scores": decision.get("agent_scores", {}), "system_state": decision.get("system_state", {}), "reason": decision.get("reason", ""), "risk": risk}, reality=RealityLevel.INFERRED, confidence=confidence, provenance="FGSE:jarvisService -> ArchOS:financial_adapter", evidence=["external_decision_normalized", "execution_authority_retained_by_archos"])
