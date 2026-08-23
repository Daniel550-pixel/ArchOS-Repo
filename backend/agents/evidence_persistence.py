"""PostgreSQL persistence adapter for the ArchOS evidence ledger."""
from datetime import datetime, timezone
from typing import Any

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


class PostgresEvidenceStore:
    async def ensure_schema(self, session: AsyncSession) -> None:
        # Deployment/migration tooling should own schema creation in production.
        # This is deliberately opt-in for local bootstrap and tests.
        bind = session.get_bind()
        if bind is not None:
            await bind.run_sync(EvidenceBase.metadata.create_all)

    async def append(self, session: AsyncSession, entry: EvidenceEntry) -> None:
        existing = await session.scalar(select(EvidenceRecordModel).where(EvidenceRecordModel.digest == entry.digest))
        if existing:
            return
        session.add(EvidenceRecordModel(
            entry_id=entry.entry_id, task_id=entry.task_id, agent_id=entry.agent_id,
            source=entry.source, claim=entry.claim, evidence=list(entry.evidence),
            confidence=entry.confidence, reality=entry.reality.value,
            created_at=datetime.fromisoformat(entry.created_at), digest=entry.digest,
        ))
        await session.commit()

    async def corroborating(self, session: AsyncSession, task_id: str, agent_id: str) -> list[dict[str, Any]]:
        rows = (await session.scalars(
            select(EvidenceRecordModel)
            .where(EvidenceRecordModel.task_id == task_id, EvidenceRecordModel.agent_id != agent_id)
            .order_by(EvidenceRecordModel.created_at.asc())
        )).all()
        return [{"source": row.source, "claim": row.claim, "confidence": row.confidence, "reality": RealityLevel(row.reality)} for row in rows]

    async def history(self, session: AsyncSession, task_id: str | None = None) -> list[dict[str, Any]]:
        query = select(EvidenceRecordModel).order_by(EvidenceRecordModel.created_at.asc())
        if task_id:
            query = query.where(EvidenceRecordModel.task_id == task_id)
        rows = (await session.scalars(query)).all()
        return [{"entry_id": r.entry_id, "task_id": r.task_id, "agent_id": r.agent_id, "source": r.source, "claim": r.claim, "evidence": r.evidence, "confidence": r.confidence, "reality": r.reality, "created_at": r.created_at.isoformat(), "digest": r.digest} for r in rows]


postgres_evidence_store = PostgresEvidenceStore()
