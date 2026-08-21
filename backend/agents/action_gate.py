"""ArchOS governed action execution boundary."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Callable
import uuid
import asyncio

from .base import RiskLevel, ActionDecision
from ..core import abac
from ..core.event_fabric import fabric


@dataclass
class ActionRequest:
    action_id: str = field(default_factory=lambda: f"act-{uuid.uuid4().hex[:12]}")
    actor: str = ""
    agent: str = ""
    task_id: str = ""
    target: str = ""
    requested_operation: str = ""
    risk_level: RiskLevel = RiskLevel.LOW_RISK
    required_authority: str = "OPERATOR_CLEARANCE"
    policy_decision: ActionDecision = ActionDecision.DENIED
    approval_state: str = "PENDING"
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
        return [self._serialize(a) for a in self._pending_actions.values()]

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [self._serialize(a) for a in reversed(self._action_history[-limit:])]

    def get_action(self, action_id: str) -> Optional[ActionRequest]:
        if action_id in self._pending_actions:
            return self._pending_actions[action_id]
        for action in reversed(self._action_history):
            if action.action_id == action_id:
                return action
        return None

    @staticmethod
    def _serialize(action: ActionRequest) -> Dict[str, Any]:
        return {
            "action_id": action.action_id,
            "actor": action.actor,
            "agent": action.agent,
            "task_id": action.task_id,
            "target": action.target,
            "requested_operation": action.requested_operation,
            "risk_level": action.risk_level.value,
            "required_authority": action.required_authority,
            "policy_decision": action.policy_decision.value,
            "approval_state": action.approval_state,
            "approved_by": action.approved_by,
            "provenance": action.provenance,
            "timestamp": action.timestamp,
            "execution_result": action.execution_result,
        }

    async def evaluate_and_submit(self, req: ActionRequest) -> ActionDecision:
        """Evaluate an action. No action may execute without an ALLOWED decision."""
        if not req.actor or not req.agent or not req.requested_operation:
            req.policy_decision = ActionDecision.DENIED
            req.approval_state = "REJECTED"
            self._action_history.append(req)
            await fabric.publish("ACTION_BLOCKED", {
                "action_id": req.action_id,
                "reason": "missing_actor_agent_or_operation",
            })
            return ActionDecision.DENIED

        ctx = {
            "actor": req.actor,
            "agent": req.agent,
            "action": req.requested_operation,
            "target": req.target,
            "risk_level": req.risk_level.value,
            "human_approved": req.approval_state == "APPROVED",
        }
        allowed = await abac.decide(ctx)
        if not allowed:
            req.policy_decision = ActionDecision.DENIED
            req.approval_state = "REJECTED"
            self._action_history.append(req)
            await fabric.publish("ACTION_BLOCKED", {
                "action_id": req.action_id,
                "target": req.target,
                "reason": "ABAC policy denial",
            })
            return ActionDecision.DENIED

        if req.risk_level in (RiskLevel.CONSEQUENTIAL, RiskLevel.HIGH_IMPACT):
            if req.approval_state != "APPROVED":
                req.policy_decision = ActionDecision.REQUIRES_APPROVAL
                req.approval_state = "PENDING"
                self._pending_actions[req.action_id] = req
                await fabric.publish("ACTION_REQUESTED", {
                    "action_id": req.action_id,
                    "target": req.target,
                    "operation": req.requested_operation,
                    "risk_level": req.risk_level.value,
                })
                return ActionDecision.REQUIRES_APPROVAL

        req.policy_decision = ActionDecision.ALLOWED
        req.approval_state = "AUTO_APPROVED" if req.approval_state != "APPROVED" else "APPROVED"
        self._action_history.append(req)
        await fabric.publish("ACTION_APPROVED", {
            "action_id": req.action_id,
            "target": req.target,
            "actor": req.actor,
        })
        return ActionDecision.ALLOWED

    async def approve(self, action_id: str, approver: str) -> bool:
        """Approve a pending action; caller authentication/authority must be verified upstream."""
        if not approver or action_id not in self._pending_actions:
            return False
        req = self._pending_actions.pop(action_id)
        req.approval_state = "APPROVED"
        req.approved_by = approver
        decision = await self.evaluate_and_submit(req)
        if decision != ActionDecision.ALLOWED:
            self._pending_actions[action_id] = req
            return False
        return True

    async def execute_governed(self, req: ActionRequest, executor: Callable) -> Dict[str, Any]:
        """Execute only after the Action Gate has explicitly allowed the exact request."""
        if req.policy_decision != ActionDecision.ALLOWED:
            raise PermissionError("ActionGate blocked execution")
        try:
            result = executor()
            if asyncio.iscoroutine(result):
                result = await result
            req.execution_result = {"status": "SUCCESS", "output": result}
            await fabric.publish("ACTION_EXECUTED", {
                "action_id": req.action_id,
                "target": req.target,
                "status": "SUCCESS",
            })
            return req.execution_result
        except Exception:
            req.execution_result = {"status": "FAILED"}
            await fabric.publish("ACTION_EXECUTED", {
                "action_id": req.action_id,
                "target": req.target,
                "status": "FAILED",
            })
            raise


action_gate = ActionGate()
