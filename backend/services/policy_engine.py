"""Authoritative ArchOS policy-engine boundary.

All consequential authorization is evaluated here before reaching ActionGate.
The boundary is fail-closed and emits an auditable decision event.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.services.event_fabric import app_event_fabric
from backend.core import abac


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    reason: str
    policy: str
    evaluated_at: str


class PolicyEngine:
    async def evaluate(self, context: dict[str, Any]) -> PolicyDecision:
        now = datetime.now(timezone.utc).isoformat()
        if not isinstance(context, dict):
            decision = PolicyDecision(False, "invalid policy context", "archos.default", now)
        else:
            actor = context.get("actor")
            action = context.get("action") or context.get("requested_operation")
            target = context.get("target", "")
            risk = str(context.get("risk_level", "")).upper()
            if not actor or str(actor).lower() == "anonymous":
                decision = PolicyDecision(False, "authenticated actor required", "archos.identity", now)
            elif not action:
                decision = PolicyDecision(False, "requested operation required", "archos.action", now)
            elif not target and risk in {"CONSEQUENTIAL", "HIGH_IMPACT"}:
                decision = PolicyDecision(False, "consequential actions require a target", "archos.target", now)
            else:
                allowed = await abac.decide(context)
                reason = "policy authorization granted" if allowed else "policy authorization denied"
                decision = PolicyDecision(allowed, reason, "archos.abac", now)

        await app_event_fabric.publish(
            "policy.evaluated",
            {
                "allowed": decision.allowed,
                "reason": decision.reason,
                "policy": decision.policy,
                "risk_level": str(context.get("risk_level", "")) if isinstance(context, dict) else "",
                "action": context.get("action") or context.get("requested_operation") if isinstance(context, dict) else None,
            },
            source="policy_engine",
            correlation_id=context.get("correlation_id") if isinstance(context, dict) else None,
        )
        return decision


policy_engine = PolicyEngine()
