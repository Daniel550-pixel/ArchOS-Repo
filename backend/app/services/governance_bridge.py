from __future__ import annotations

from typing import Any, Callable, Optional

from backend.agents.action_gate import ActionRequest, action_gate


class GovernanceBridge:
    """App-layer boundary around the sovereign ActionGate."""

    async def evaluate_and_submit(self, request: ActionRequest):
        return await action_gate.evaluate_and_submit(request)

    async def approve(self, action_id: str, approver: str) -> bool:
        return await action_gate.approve(action_id, approver)

    async def execute(self, request: ActionRequest, executor: Callable[..., Any]) -> dict[str, Any]:
        return await action_gate.execute_governed(request, executor)

    def get_action(self, action_id: str) -> Optional[ActionRequest]:
        return action_gate.get_action(action_id)

    def pending(self) -> list[dict[str, Any]]:
        return action_gate.get_pending()

    def history(self, limit: int = 50) -> list[dict[str, Any]]:
        return action_gate.get_history(limit)


governance_bridge = GovernanceBridge()
