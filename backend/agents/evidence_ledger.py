"""Append-only in-process evidence ledger for cross-agent corroboration."""
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any
import asyncio
import hashlib
import json

from .base import AgentResult, AgentTask, RealityLevel
from .evidence import EvidenceRecord


@dataclass(frozen=True)
class EvidenceEntry:
    entry_id: str
    task_id: str
    agent_id: str
    source: str
    claim: str
    evidence: tuple[str, ...]
    confidence: float
    reality: RealityLevel
    created_at: str
    digest: str


class EvidenceLedger:
    """Record evidence claims and return independent corroborating sources."""

    def __init__(self) -> None:
        self._entries: list[EvidenceEntry] = []
        self._lock = asyncio.Lock()

    async def record_result(self, task: AgentTask, result: AgentResult) -> EvidenceEntry:
        claim = json.dumps(result.output, sort_keys=True, default=str)
        source = result.provenance or result.agent_id
        evidence = tuple(result.evidence)
        created_at = datetime.now(timezone.utc).isoformat()
        raw = f"{task.task_id}|{result.agent_id}|{source}|{claim}|{evidence}|{created_at}"
        digest = hashlib.sha256(raw.encode()).hexdigest()
        entry = EvidenceEntry(
            entry_id=f"evidence-{digest[:16]}", task_id=task.task_id, agent_id=result.agent_id,
            source=source, claim=claim, evidence=evidence,
            confidence=max(0.0, min(1.0, float(result.confidence))),
            reality=result.reality, created_at=created_at, digest=digest,
        )
        async with self._lock:
            self._entries.append(entry)
        return entry

    async def corroborating(self, task: AgentTask, result: AgentResult) -> list[EvidenceRecord]:
        async with self._lock:
            entries = [e for e in self._entries if e.task_id == task.task_id and e.agent_id != result.agent_id]
        return [EvidenceRecord(source=e.source, claim=e.claim, confidence=e.confidence, reality=e.reality) for e in entries]

    async def history(self, task_id: str | None = None) -> list[dict[str, Any]]:
        async with self._lock:
            entries = self._entries if task_id is None else [e for e in self._entries if e.task_id == task_id]
            return [asdict(e) for e in entries]


evidence_ledger = EvidenceLedger()
