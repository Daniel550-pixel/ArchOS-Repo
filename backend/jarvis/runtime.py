"""Authoritative J.A.R.V.I.S. Runtime.
Routes every request through the canonical orchestrator and optionally injects
promoted FinSight intelligence as a verified analytical context envelope.
"""
from __future__ import annotations

from typing import Dict, Any
from uuid import uuid4

from ..agents.jarvis_orchestrator import jarvis_orchestrator
from ..agents.action_gate import action_gate
from ..agents.base import AgentTask, AgentCapability, RiskLevel
from ..agents.swarm import swarm


async def _financial_context(query: dict[str, Any]) -> dict[str, Any] | None:
    market_data = query.get("market_data")
    if not isinstance(market_data, list) or not market_data:
        return None

    task_id = f"fin-{uuid4().hex[:12]}"
    task = AgentTask(
        task_id=task_id,
        intent="FINANCIAL_ASSESSMENT",
        payload={"market_data": market_data},
        actor=query.get("actor", "operator"),
        tenant_id=query.get("tenant_id", "uae-sovereign"),
        required_capabilities={AgentCapability.FINANCIAL_INTELLIGENCE},
        risk_level=RiskLevel.READ_ONLY,
        verification_required=True,
    )
    result = await swarm.route(task)
    return {
        "status": result.status,
        "output": result.output,
        "confidence": result.confidence,
        "reality": result.reality.value,
        "provenance": result.provenance,
        "execution_time_ms": result.execution_time_ms,
        "execution_authority": False,
    }


async def run(query: dict) -> Dict[str, Any]:
    """Run canonical JARVIS with promoted intelligence adapters in-band."""
    q_str = query.get("query", "")
    actor = query.get("actor", "operator")
    tenant_id = query.get("tenant_id", "uae-sovereign")

    context = dict(query)
    financial = await _financial_context(query)
    if financial is not None:
        context["financial_intelligence"] = financial

    session = await jarvis_orchestrator.orchestrate(
        query=q_str,
        actor=actor,
        tenant_id=tenant_id,
        context=context,
    )

    if financial is not None:
        session["stages"].insert(4, {
            "stage": "4_FINANCIAL_INTELLIGENCE",
            "stage_name": "Promoted FinSight Analytical Assessment",
            "agent": "financial_intelligence",
            "execution_time_ms": financial["execution_time_ms"],
            "status": financial["status"],
            "output": financial["output"],
            "reality": financial["reality"],
            "provenance": financial["provenance"],
            "execution_authority": False,
        })

    return {
        "answer": session["final_answer"],
        "task_id": session["task_id"],
        "stages": session["stages"],
        "inter_agent_messages": session["inter_agent_messages"],
        "verification_status": session["verification_status"],
        "reality": session["reality"],
        "confidence": session["confidence"],
        "execution_time_ms": session["execution_time_ms"],
        "integrations": {
            "financial_intelligence": financial is not None,
            "financial_execution_authority": False,
        },
    }


async def get_action_gate_status():
    return {"pending": action_gate.get_pending(), "history": action_gate.get_history()}


async def approve_action(action_id: str, approver: str = "operator"):
    ok = await action_gate.approve(action_id, approver)
    return {"approved": ok, "action_id": action_id}
