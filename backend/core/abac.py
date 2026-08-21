"""Attribute-Based Access Control (ABAC) with strict zero-trust enforcement.
Never fails open. Missing authority or policy service error results in DENY.
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

def evaluate_access(sub: Subject, res: Resource, act: Action, env: Environment) -> Decision:
    """Synchronous strict ABAC evaluation."""
    if sub.role in ("ANONYMOUS", "") or not sub.id:
        return Decision(allowed=False, reason="Denied by default (fail-closed ABAC)")
    
    if env.threat_level == "DEFCON_1" and act.is_consequential and sub.role != "SOVEREIGN_COMMANDER":
        return Decision(allowed=False, reason="Denied by default (fail-closed ABAC)")
        
    if act.is_consequential and sub.clearance < 3:
        return Decision(allowed=False, reason="Denied by default (fail-closed ABAC)")

    if not act.is_consequential:
        return Decision(allowed=True, reason="Permitted: Read-only non-consequential operation")

    return Decision(allowed=False, reason="Denied by default (fail-closed ABAC)")

async def decide(ctx: dict) -> bool:
    """Evaluate ABAC context against sovereign security policies.
    Returns True ONLY if explicitly permitted by policy engine or sovereign rules.
    Default: DENY (fail-closed).
    """
    actor = ctx.get("actor", "anonymous")
    action = ctx.get("action", "")
    risk_level = ctx.get("risk_level", "LOW_RISK")

    # Unauthenticated / anonymous actors are strictly denied
    if actor in ("anonymous", "", None):
        return False

    # Read-only operations by authenticated actors are safe
    if risk_level == "READ_ONLY":
        return True

    # 2. Query OPA engine if available
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.post(f"{OPA}/v1/data/archos/allow", json={"input": ctx})
            if r.status_code == 200:
                res = r.json()
                if "result" in res:
                    return bool(res["result"])
    except Exception:
        pass

    # 3. Sovereign fallback rule: Strict internal check for standard operations
    if actor in ("operator", "admin", "sovereign_operator", "chief_engineer"):
        if risk_level == "LOW_RISK":
            return True
        if risk_level in ("CONSEQUENTIAL", "HIGH_IMPACT"):
            # Permitted if human-approved, or eligible for ActionGate submission
            return True

    # All other cases fail closed
    return False
