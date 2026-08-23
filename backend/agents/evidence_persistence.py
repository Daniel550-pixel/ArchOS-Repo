"""PostgreSQL persistence adapter with tamper-evident evidence chaining."""
from datetime import datetime
from typing import Any
import hashlib
import json

from sqlalchemy import DateTime, Float, Integer, String, Text, JSON, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession

from .evidence_ledger import EvidenceEntry
from .base import RealityLevel


class EvidenceBase(DeclarativeBase):
    pass


class EvidenceRecordModel(EvidenceBase):
    __tablename__ = "archos_evidence_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    task_id: Mapped[str] = mapped_column(String(120), index=True)
    agent_id: Mapped[str] = mapped_column(String(120), index=True)
    source: Mapped[str] = mapped_column(String(500))
    claim: Mapped[str] = mapped_column(Text)
    evidence: Mapped[list[str]] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float)
    reality: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    digest: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    previous_digest: Mapped[str | None] = mapped_column(String(64), nullable=True)
    chain_digest: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)


class EvidenceChainStateModel(EvidenceBase):
    __tablename__ = "archos_evidence_chain_state"

    chain_name: Mapped[str] = mapped_column(String(80), primary_key=True)
    latest_digest: Mapped[str | None] = mapped_column(String(64), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


def canonical_chain_payload(entry: EvidenceEntry, previous_digest: str | None) -> str:
    """Return the single canonical JSON representation used by app + migrations."""
    payload = {
        "entry_id": entry.entry_id,
        "task_id": entry.task_id,
        "agent_id": entry.agent_id,
        "source": entry.source,
        "claim": entry.claim,
        "evidence": list(entry.evidence),
        "confidence": round(float(entry.confidence), 12),
        "reality": entry.reality.value,
        "created_at": entry.created_at,
        "digest": entry.digest,
        "previous_digest": previous_digest,
    }
    # Keep default JSON separators: PostgreSQL json_build_object::text uses the
    # same compact JSON values with a space after separators. Key ordering is
    # deterministic via sort_keys so migration and runtime hashing agree.
    return json.dumps(payload, sort_keys=True, ensure_ascii=False)


def calculate_chain_digest(entry: EvidenceEntry, previous_digest: str | None) -> str:
    return hashlib.sha256(canonical_chain_payload(entry, previous_digest).encode("utf-8")).hexdigest()


class PostgresEvidenceStore:
    async def ensure_schema(self, session: AsyncSession) -> None:
        # Local bootstrap/tests only. Production uses versioned migrations.
        bind = session.get_bind()
        if bind is not None:
            await bind.run_sync(EvidenceBase.metadata.create_all)

    async def append(self, session: AsyncSession, entry: EvidenceEntry) -> str | None:
        existing = await session.scalar(select(EvidenceRecordModel).where(EvidenceRecordModel.digest == entry.digest))
        if existing:
            return existing.chain_digest

        state = await session.scalar(
            select(EvidenceChainStateModel)
            .where(EvidenceChainStateModel.chain_name == "default")
            .with_for_update()
        )
        if state is None:
            state = EvidenceChainStateModel(chain_name="default", latest_digest=None, updated_at=datetime.now().astimezone())
            session.add(state)
            await session.flush()
            await session.refresh(state)

        previous_digest = state.latest_digest
        chain_digest = calculate_chain_digest(entry, previous_digest)
        session.add(EvidenceRecordModel(
            entry_id=entry.entry_id, task_id=entry.task_id, agent_id=entry.agent_id,
            source=entry.source, claim=entry.claim, evidence=list(entry.evidence),
            confidence=entry.confidence, reality=entry.reality.value,
            created_at=datetime.fromisoformat(entry.created_at), digest=entry.digest,
            previous_digest=previous_digest, chain_digest=chain_digest,
        ))
        state.latest_digest = chain_digest
        state.updated_at = datetime.now().astimezone()
        await session.commit()
        return chain_digest

    async def corroborating(self, session: AsyncSession, task_id: str, agent_id: str) -> list[dict[str, Any]]:
        rows = (await session.scalars(
            select(EvidenceRecordModel)
            .where(EvidenceRecordModel.task_id == task_id, EvidenceRecordModel.agent_id != agent_id)
            .order_by(EvidenceRecordModel.created_at.asc(), EvidenceRecordModel.id.asc())
        )).all()
        return [{"source": row.source, "claim": row.claim, "confidence": row.confidence, "reality": RealityLevel(row.reality)} for row in rows]

    async def history(self, session: AsyncSession, task_id: str | None = None) -> list[dict[str, Any]]:
        query = select(EvidenceRecordModel).order_by(EvidenceRecordModel.created_at.asc(), EvidenceRecordModel.id.asc())
        if task_id:
            query = query.where(EvidenceRecordModel.task_id == task_id)
        rows = (await session.scalars(query)).all()
        return [{
            "entry_id": r.entry_id, "task_id": r.task_id, "agent_id": r.agent_id,
            "source": r.source, "claim": r.claim, "evidence": r.evidence,
            "confidence": r.confidence, "reality": r.reality,
            "created_at": r.created_at.isoformat(), "digest": r.digest,
            "previous_digest": r.previous_digest, "chain_digest": r.chain_digest,
        } for r in rows]

    async def verify_chain(self, session: AsyncSession) -> dict[str, Any]:
        rows = (await session.scalars(
            select(EvidenceRecordModel).order_by(EvidenceRecordModel.id.asc())
        )).all()
        previous: str | None = None
        failures: list[dict[str, Any]] = []
        for row in rows:
            entry = EvidenceEntry(
                entry_id=row.entry_id, task_id=row.task_id, agent_id=row.agent_id,
                source=row.source, claim=row.claim, evidence=tuple(row.evidence or []),
                confidence=row.confidence, reality=RealityLevel(row.reality),
                created_at=row.created_at.isoformat(), digest=row.digest,
            )
            expected = calculate_chain_digest(entry, previous)
            if row.previous_digest != previous or row.chain_digest != expected:
                failures.append({"entry_id": row.entry_id, "expected_previous": previous, "actual_previous": row.previous_digest, "expected_chain": expected, "actual_chain": row.chain_digest})
            previous = row.chain_digest
        state = await session.scalar(select(EvidenceChainStateModel).where(EvidenceChainStateModel.chain_name == "default"))
        state_matches = (state is None and not rows) or (state is not None and state.latest_digest == previous)
        return {"valid": not failures and state_matches, "entries_checked": len(rows), "latest_digest": previous, "state_matches": state_matches, "failures": failures}


postgres_evidence_store = PostgresEvidenceStore()
