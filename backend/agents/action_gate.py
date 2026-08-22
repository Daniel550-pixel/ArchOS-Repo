"""ArchOS governed action execution boundary."""
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional
import asyncio
import uuid

from .base import RiskLevel, ActionDecision
from backend.services.policy_engine import policy_engine
from app.services.event_fabric import app_event_fabric

MAX_PENDING_ACTIONS = 1000
MAX_ACTION_HISTORY = 5000

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
    payload: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_result: Optional[dict[str, Any]] = None

class ActionGate:
    def __init__(self) -> None:
        self._pending_actions: dict[str, ActionRequest] = {}
        self._action_history: deque[ActionRequest] = deque(maxlen=MAX_ACTION_HISTORY)

    def get_pending(self) -> list[dict[str, Any]]:
        return [self._serialize(a) for a in self._pending_actions.values()]

    def get_history(self, limit: int = 50) -> list[dict[str, Any]]:
        return [self._serialize(a) for a in reversed(list(self._action_history)[-max(0, limit):])]

    def get_action(self, action_id: str) -> Optional[ActionRequest]:
        if action_id in self._pending_actions:
            return self._pending_actions[action_id]
        for action in reversed(self._action_history):
            if action.action_id == action_id:
                return action
        return None

    @staticmethod
    def _serialize(action: ActionRequest) -> dict[str, Any]:
        return {"action_id": action.action_id, "actor": action.actor, "agent": action.agent, "task_id": action.task_id, "target": action.target, "requested_operation": action.requested_operation, "risk_level": action.risk_level.value, "required_authority": action.required_authority, "policy_decision": action.policy_decision.value, "approval_state": action.approval_state, "approved_by": action.approved_by, "provenance": action.provenance, "timestamp": action.timestamp, "execution_result": action.execution_result}

    async def _publish(self, event_type: str, payload: dict[str, Any]) -> None:
        await app_event_fabric.publish(event_type, payload, source="action_gate")

    async def evaluate_and_submit(self, req: ActionRequest) -> ActionDecision:
        if not req.actor or not req.agent or not req.requested_operation:
            req.policy_decision = ActionDecision.DENIED
            req.approval_state = "REJECTED"
            self._action_history.append(req)
            await self._publish("governance.action_blocked", {"action_id": req.action_id, "reason": "missing_actor_agent_or_operation"})
            return ActionDecision.DENIED

        ctx = {
            "actor": req.actor,
            "agent": req.agent,
            "action": req.requested_operation,
            "target": req.target,
            "risk_level": req.risk_level.value,
            "human_approved": req.approval_state == "APPROVED",
            "required_authority": req.required_authority,
            "task_id": req.task_id,
            "correlation_id": req.task_id or req.action_id,
        }
        decision = await policy_engine.evaluate(ctx)
        if not decision.allowed:
            req.policy_decision = ActionDecision.DENIED
            req.approval_state = "REJECTED"
            self._action_history.append(req)
            await self._publish("governance.action_blocked", {"action_id": req.action_id, "target": req.target, "reason": decision.reason, "policy": decision.policy})
            return ActionDecision.DENIED

        if req.risk_level in (RiskLevel.CONSEQUENTIAL, RiskLevel.HIGH_IMPACT) and req.approval_state != "APPROVED":
            if len(self._pending_actions) >= MAX_PENDING_ACTIONS:
                req.policy_decision = ActionDecision.DENIED
                req.approval_state = "REJECTED"
                self._action_history.append(req)
                await self._publish("governance.action_blocked", {"action_id": req.action_id, "reason": "pending_action_capacity_exceeded"})
                return ActionDecision.DENIED
            req.policy_decision = ActionDecision.REQUIRES_APPROVAL
            req.approval_state = "PENDING"
            self._pending_actions[req.action_id] = req
            await self._publish("governance.action_requested", {"action_id": req.action_id, "target": req.target, "operation": req.requested_operation, "risk_level": req.risk_level.value})
            return ActionDecision.REQUIRES_APPROVAL

        req.policy_decision = ActionDecision.ALLOWED
        req.approval_state = "AUTO_APPROVED" if req.approval_state != "APPROVED" else "APPROVED"
        self._action_history.append(req)
        await self._publish("governance.action_approved", {"action_id": req.action_id, "target": req.target, "actor": req.actor, "policy": decision.policy})
        return ActionDecision.ALLOWED

    async def approve(self, action_id: str, approver: str) -> bool:
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

    async def execute_governed(self, req: ActionRequest, executor: Callable[..., Any]) -> dict[str, Any]:
        if req.policy_decision != ActionDecision.ALLOWED:
            raise PermissionError("ActionGate blocked execution")
        try:
            result = executor()
            if asyncio.iscoroutine(result):
                result = await result
            req.execution_result = {"status": "SUCCESS", "output": result}
            await self._publish("governance.action_executed", {"action_id": req.action_id, "target": req.target, "status": "SUCCESS"})
            return req.execution_result
        except Exception:
            req.execution_result = {"status": "FAILED"}
            await self._publish("governance.action_executed", {"action_id": req.action_id, "target": req.target, "status": "FAILED"})
            raise

action_gate = ActionGate()
