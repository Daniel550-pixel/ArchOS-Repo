"""Governance boundary for consequential ArchOS operations."""
from functools import wraps
from hashlib import sha256
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import uuid4

AUDIT: List[Dict[str, Any]] = []
_LAST_AUDIT_HASH = "0" * 64


def _append_audit(record: Dict[str, Any]) -> Dict[str, Any]:
    global _LAST_AUDIT_HASH
    record["previous_hash"] = _LAST_AUDIT_HASH
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":"))
    record["record_hash"] = sha256(
        (canonical + _LAST_AUDIT_HASH).encode("utf-8")
    ).hexdigest()
    AUDIT.append(record)
    _LAST_AUDIT_HASH = record["record_hash"]
    return record


def requires_authority(level: str):
    """Require authenticated identity and approval for consequential actions."""
    normalized_level = level.upper().strip()
    if normalized_level not in {"LOW_RISK", "CONSEQUENTIAL", "HIGH_IMPACT"}:
        raise ValueError(f"Unsupported authority level: {level}")

    def deco(fn):
        @wraps(fn)
        async def wrapper(ctx, *a, **kw):
            identity = getattr(ctx, "identity", None)
            approved = bool(getattr(ctx, "human_approved", False))

            if not identity:
                _append_audit({
                    "event_id": str(uuid4()),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "actor": "anonymous",
                    "action": fn.__name__,
                    "level": normalized_level,
                    "decision": "DENY",
                    "reason": "missing_identity",
                })
                raise PermissionError("Authenticated identity required")

            if normalized_level in {"CONSEQUENTIAL", "HIGH_IMPACT"} and not approved:
                _append_audit({
                    "event_id": str(uuid4()),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "actor": str(identity),
                    "action": fn.__name__,
                    "level": normalized_level,
                    "decision": "DENY",
                    "reason": "human_approval_required",
                })
                raise PermissionError(
                    f"Human approval required for {normalized_level.lower()} action"
                )

            _append_audit({
                "event_id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor": str(identity),
                "action": fn.__name__,
                "level": normalized_level,
                "decision": "ALLOW",
                "reason": "governance_policy_satisfied",
            })
            return await fn(ctx, *a, **kw)

        return wrapper
    return deco
