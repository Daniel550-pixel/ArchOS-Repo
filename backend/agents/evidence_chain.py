"""Integrity verification helpers for the persistent evidence chain."""
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from .evidence_persistence import postgres_evidence_store


@dataclass(frozen=True)
class ChainVerificationResult:
    valid: bool
    entries_checked: int
    latest_digest: str | None
    state_matches: bool
    failures: tuple[dict[str, Any], ...]


async def verify_evidence_chain(session: AsyncSession) -> ChainVerificationResult:
    """Return a structured, fail-closed integrity result."""
    result = await postgres_evidence_store.verify_chain(session)
    return ChainVerificationResult(
        valid=bool(result["valid"]),
        entries_checked=int(result["entries_checked"]),
        latest_digest=result["latest_digest"],
        state_matches=bool(result["state_matches"]),
        failures=tuple(result["failures"]),
    )
