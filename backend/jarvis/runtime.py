"""Authoritative J.A.R.V.I.S. Runtime.
Routes all requests through the canonical multi-agent orchestrator:
UNDERSTAND -> CONTEXT -> QUERY_WORLD_MODEL -> SELECT_AGENTS -> REASON -> PLAN -> SIMULATE/RISK -> VERIFY -> GOVERN -> RESPOND_OR_ACT.
"""
from typing import Dict, Any
from ..agents.jarvis_orchestrator import jarvis_orchestrator
from ..agents.action_gate import action_gate

async def run(query: dict) -> Dict[str, Any]:
    """Authoritative entrypoint for JARVIS queries."""
    q_str = query.get("query", "")
    actor = query.get("actor", "operator")
    tenant_id = query.get("tenant_id", "uae-sovereign")
    
    session = await jarvis_orchestrator.orchestrate(
        query=q_str,
        actor=actor,
        tenant_id=tenant_id,
        context=query
    )

    return {
        "answer": session["final_answer"],
        "task_id": session["task_id"],
        "stages": session["stages"],
        "inter_agent_messages": session["inter_agent_messages"],
        "verification_status": session["verification_status"],
        "reality": session["reality"],
        "confidence": session["confidence"],
        "execution_time_ms": session["execution_time_ms"]
    }

async def get_action_gate_status():
    return {
        "pending": action_gate.get_pending(),
        "history": action_gate.get_history()
    }

async def approve_action(action_id: str, approver: str = "operator"):
    ok = await action_gate.approve(action_id, approver)
    return {"approved": ok, "action_id": action_id}
