"""Attribute-Based Access Control (ABAC) with strict zero-trust enforcement.

Security invariant:
- Authentication/identity must be established before authorization.
- Non-consequential read-only access may be granted only to an authenticated actor.
- Consequential and high-impact actions require an explicit policy-engine decision.
- Policy-engine errors, malformed responses, timeouts, and unavailable policy
  services always result in DENY. There is no privileged fail-open fallback.
"""

import os
from dataclasses import dataclass
from typing import Optional, Dict, Any

OPA = os.getenv("OPA_URL", "http://opa:8181")


@dataclass
class Subject:
    id: str
    role: str = "OPERATOR"
    clearance: int = 1
    attributes: Optional[Dict[str, Any]] = None


@dataclass
class Resource:
    id: str
    type: str
    sensitivity: int = 1
    attributes: Optional[Dict[str, Any]] = None


@dataclass
class Action:
    type: str
    is_consequential: bool = False
    attributes: Optional[Dict[str, Any]] = None


@dataclass
class Environment:
    threat_level: str = "DEFCON_5"
    timestamp: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


@dataclass
class Decision:
    allowed: bool
    reason: str


def _deny(reason: str) -> Decision:
    return Decision(allowed=False, reason=reason)


def evaluate_access(sub: Subject, res: Resource, act: Action, env: Environment) -> Decision:
    """Synchronous local ABAC checks.

    This function intentionally does not grant consequential access. Such access
    must pass the authoritative asynchronous policy-engine decision in ``decide``.
    """
    if not sub.id or sub.role in ("ANONYMOUS", ""):
        return _deny("DENY: authenticated subject required")

    if env.threat_level == "DEFCON_1" and act.is_consequential:
        if sub.role != "SOVEREIGN_COMMANDER":
            return _deny("DENY: consequential action restricted at DEFCON_1")

    if act.is_consequential and sub.clearance < 3:
        return _deny("DENY: insufficient clearance for consequential action")

    if not act.is_consequential:
        return Decision(
            allowed=True,
            reason="ALLOW: authenticated non-consequential operation",
        )

    return _deny("DENY: consequential action requires explicit policy authorization")


async def decide(ctx: dict) -> bool:
    """Evaluate authorization context against the authoritative policy engine.

    The function is deliberately fail-closed: any missing identity, unavailable
    policy service, timeout, non-success HTTP response, malformed response, or
    non-boolean policy result returns ``False``.
    """
    if not isinstance(ctx, dict):
        return False

    actor = ctx.get("actor")
    risk_level = str(ctx.get("risk_level", "")).upper()

    # Identity is mandatory. Never authorize anonymous/default actors.
    if not isinstance(actor, str) or not actor.strip() or actor.lower() == "anonymous":
        return False

    # Only explicitly read-only operations can use the local low-risk path.
    # Consequential/high-impact actions MUST reach the policy engine.
    if risk_level in ("READ_ONLY", "LOW_RISK"):
        return True

    if risk_level not in ("CONSEQUENTIAL", "HIGH_IMPACT"):
        return False

    try:
        import httpx

        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.post(
                f"{OPA}/v1/data/archos/allow",
                json={"input": ctx},
            )

            if response.status_code != 200:
                return False

            payload = response.json()
            result = payload.get("result")

            # A policy response must contain an actual boolean decision.
            if not isinstance(result, bool):
                return False

            return result
    except Exception:
        # Security-critical path: policy uncertainty is DENY.
        return False
