"""ArchOS Action Gate & Consequential Execution Boundary.
Enforces zero-trust authorization, strict ABAC, human sign-off for high-impact actions,
and publishes immutable audit events to the Event Fabric.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Callable
import uuid
import asyncio

from .base import RiskLevel, ActionDecision
from ..core import abac, governance
from ..core.event_fabric import fabric

@dataclass
class ActionRequest:
    action_id: str = field(default_factory=lambda: f"act-{uuid.uuid4().hex[:12]}")
    actor: str = "operator"
    agent: str = "execution"
    task_id: str = ""
    target: str = ""
    requested_operation: str = ""
    risk_level: RiskLevel = RiskLevel.LOW_RISK
    required_authority: str = "OPERATOR_CLEARANCE"
    policy_decision: ActionDecision = ActionDecision.DENIED
    approval_state: str = "PENDING"  # PENDING | APPROVED | REJECTED | AUTO_APPROVED
    approved_by: Optional[str] = None
    provenance: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_result: Optional[Dict[str, Any]] = None

class ActionGate:
    def __init__(self):
        self._pending_actions: Dict[str, ActionRequest] = {}
        self._action_history: List[ActionRequest] = []

    def get_pending(self) -> List[Dict[str, Any]]:
        return [
            {
                "action_id": a.action_id,
                "actor": a.actor,
                "agent": a.agent,
                "task_id": a.task_id,
                "target": a.target,
                "requested_operation": a.requested_operation,
                "risk_level": a.risk_level.value if hasattr(a.risk_level, "value") else str(a.risk_level),
                "required_authority": a.required_authority,
                "approval_state": a.approval_state,
                "provenance": a.provenance,
                "timestamp": a.timestamp,
                "payload": a.payload
            }
            for a in self._pending_actions.values()
        ]

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [
            {
                "action_id": a.action_id,
                "actor": a.actor,
                "agent": a.agent,
                "task_id": a.task_id,
                "target": a.target,
                "requested_operation": a.requested_operation,
                "risk_level": a.risk_level.value if hasattr(a.risk_level, "value") else str(a.risk_level),
                "policy_decision": a.policy_decision.value if hasattr(a.policy_decision, "value") else str(a.policy_decision),
                "approval_state": a.approval_state,
                "approved_by": a.approved_by,
                "timestamp": a.timestamp,
                "execution_result": a.execution_result
            }
            for a in reversed(self._action_history[-limit:])
        ]

    async def evaluate_and_submit(self, req: ActionRequest) -> ActionDecision:
        """Evaluate action authorization through strict ABAC & Governance rules."""
        # 1. Audit log registration
        governance.AUDIT.append({
            "action_id": req.action_id,
            "actor": req.actor,
            "agent": req.agent,
            "task_id": req.task_id,
            "target": req.target,
            "operation": req.requested_operation,
            "risk_level": req.risk_level.value if hasattr(req.risk_level, "value") else str(req.risk_level),
            "timestamp": req.timestamp
        })

        # 2. Check ABAC Policy Engine
        ctx = {
            "actor": req.actor,
            "agent": req.agent,
            "action": req.requested_operation,
            "target": req.target,
            "risk_level": req.risk_level.value if hasattr(req.risk_level, "value") else str(req.risk_level),
            "human_approved": req.approval_state == "APPROVED"
        }
        allowed = await abac.decide(ctx)

        if not allowed:
            req.policy_decision = ActionDecision.DENIED
            req.approval_state = "REJECTED"
            self._action_history.append(req)
            try:
                await fabric.publish("ACTION_BLOCKED", {
                    "action_id": req.action_id,
                    "target": req.target,
                    "reason": "ABAC policy or security clearance denial"
                })
            except Exception:
                pass
            return ActionDecision.DENIED

        # 3. Check Consequential / High Impact Human-in-the-Loop requirement
        if req.risk_level in (RiskLevel.CONSEQUENTIAL, RiskLevel.HIGH_IMPACT):
            if req.approval_state != "APPROVED":
                req.policy_decision = ActionDecision.REQUIRES_APPROVAL
                req.approval_state = "PENDING"
                self._pending_actions[req.action_id] = req
                try:
                    await fabric.publish("ACTION_REQUESTED", {
                        "action_id": req.action_id,
                        "target": req.target,
                        "operation": req.requested_operation,
                        "risk_level": str(req.risk_level)
                    })
                except Exception:
                    pass
                return ActionDecision.REQUIRES_APPROVAL

        # 4. Low risk / read-only automatically allowed
        req.policy_decision = ActionDecision.ALLOWED
        req.approval_state = "AUTO_APPROVED"
        self._action_history.append(req)
        try:
            await fabric.publish("ACTION_APPROVED", {
                "action_id": req.action_id,
                "target": req.target,
                "actor": req.actor
            })
        except Exception:
            pass
        return ActionDecision.ALLOWED

    async def approve(self, action_id: str, approver: str) -> bool:
        """Sign off on a pending consequential action."""
        if action_id not in self._pending_actions:
            return False
        req = self._pending_actions.pop(action_id)
        req.approval_state = "APPROVED"
        req.approved_by = approver
        req.policy_decision = ActionDecision.ALLOWED
        self._action_history.append(req)

        try:
            await fabric.publish("ACTION_APPROVED", {
                "action_id": req.action_id,
                "target": req.target,
                "approved_by": approver
            })
        except Exception:
            pass
        return True

    async def execute_governed(self, req: ActionRequest, executor: Callable) -> Dict[str, Any]:
        """Execute action only when policy decision is ALLOWED."""
        if req.policy_decision != ActionDecision.ALLOWED:
            raise PermissionError(f"ActionGate blocked execution: decision is {req.policy_decision}")

        try:
            res = executor()
            if asyncio.iscoroutine(res):
                res = await res
            req.execution_result = {"status": "SUCCESS", "output": res}
            try:
                await fabric.publish("ACTION_EXECUTED", {
                    "action_id": req.action_id,
                    "target": req.target,
                    "status": "SUCCESS"
                })
            except Exception:
                pass
            return req.execution_result
        except Exception as e:
            req.execution_result = {"status": "FAILED", "error": str(e)}
            try:
                await fabric.publish("ACTION_EXECUTED", {
                    "action_id": req.action_id,
                    "target": req.target,
                    "status": "FAILED",
                    "error": str(e)
                })
            except Exception:
                pass
            raise e

action_gate = ActionGate()
