"""Governance boundary for consequential ArchOS operations."""
from functools import wraps
from hashlib import sha256
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.database import AuditRecord

AUDIT: List[Dict[str, Any]] = []
_LAST_AUDIT_HASH = "0" * 64


def _append_audit(record: Dict[str, Any]) -> Dict[str, Any]:
    global _LAST_AUDIT_HASH
    record["previous_hash"] = _LAST_AUDIT_HASH
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":"), default=str)
    record["record_hash"] = sha256(
        (canonical + _LAST_AUDIT_HASH).encode("utf-8")
    ).hexdigest()
    AUDIT.append(record)
    _LAST_AUDIT_HASH = record["record_hash"]
    return record


async def _persist_audit(ctx: Any, record: Dict[str, Any]) -> None:
    """Persist an audit decision before the governed operation proceeds."""
    session = getattr(ctx, "db", None)
    if not isinstance(session, AsyncSession):
        if settings.ENVIRONMENT == "production":
            raise PermissionError("Durable audit session required in production")
        _append_audit(record)
        return

    current_max = await session.scalar(select(func.max(AuditRecord.sequence)))
    sequence = (current_max or 0) + 1
    _append_audit(record)

    audit_row = AuditRecord(
        event_id=record["event_id"],
        sequence=sequence,
        occurred_at=datetime.now(timezone.utc),
        actor=record["actor"],
        action=record["action"],
        authority_level=record["level"],
        decision=record["decision"],
        tenant_id=record.get("tenant_id"),
        correlation_id=record.get("correlation_id"),
        reason=record.get("reason"),
        payload=record,
        previous_hash=record["previous_hash"],
        record_hash=record["record_hash"],
    )
    session.add(audit_row)
    await session.commit()


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
            base = {
                "event_id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor": str(identity) if identity else "anonymous",
                "action": fn.__name__,
                "level": normalized_level,
                "tenant_id": getattr(ctx, "tenant_id", None),
                "correlation_id": getattr(ctx, "correlation_id", None),
            }

            if not identity:
                base.update({"decision": "DENY", "reason": "missing_identity"})
                await _persist_audit(ctx, base)
                raise PermissionError("Authenticated identity required")

            if normalized_level in {"CONSEQUENTIAL", "HIGH_IMPACT"} and not approved:
                base.update({"decision": "DENY", "reason": "human_approval_required"})
                await _persist_audit(ctx, base)
                raise PermissionError(
                    f"Human approval required for {normalized_level.lower()} action"
                )

            base.update({"decision": "ALLOW", "reason": "governance_policy_satisfied"})
            await _persist_audit(ctx, base)
            return await fn(ctx, *a, **kw)

        return wrapper
    return deco
