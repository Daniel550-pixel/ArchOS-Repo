"""Regression tests for evidence-chain integrity semantics."""
from datetime import datetime, timezone

import pytest
from sqlalchemy import select, text

from backend.agents.base import RealityLevel
from backend.agents.evidence_ledger import EvidenceEntry
from backend.agents.evidence_persistence import EvidenceRecordModel, postgres_evidence_store


def make_entry(entry_id: str = "entry-a", digest: str = "a" * 64) -> EvidenceEntry:
    return EvidenceEntry(
        entry_id=entry_id,
        task_id="task-1",
        agent_id="agent-a",
        source="source-a",
        claim="claim-a",
        evidence=("evidence-a",),
        confidence=0.9,
        reality=RealityLevel.OBSERVED,
        created_at=datetime.now(timezone.utc).isoformat(),
        digest=digest,
    )


async def tamper(db_session, column: str, value: str):
    await db_session.execute(text("ALTER TABLE archos_evidence_ledger DISABLE TRIGGER trg_archos_evidence_no_update"))
    await db_session.execute(text(f"UPDATE archos_evidence_ledger SET {column} = :value WHERE entry_id = 'entry-a'"), {"value": value})
    await db_session.execute(text("ALTER TABLE archos_evidence_ledger ENABLE TRIGGER trg_archos_evidence_no_update"))
    await db_session.commit()


@pytest.mark.asyncio
async def test_valid_chain(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is True
    assert result["entries_checked"] == 1


@pytest.mark.asyncio
async def test_changed_claim_fails_chain(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    await tamper(db_session, "claim", "tampered")
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False
    assert result["failures"]


@pytest.mark.asyncio
async def test_changed_evidence_fails_chain(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    await tamper(db_session, "evidence", '["tampered"]')
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False


@pytest.mark.asyncio
async def test_changed_digest_fails_chain(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    await tamper(db_session, "digest", "b" * 64)
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False


@pytest.mark.asyncio
async def test_append_only_rejects_update(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    row = (await db_session.execute(select(EvidenceRecordModel).where(EvidenceRecordModel.entry_id == "entry-a"))).scalar_one()
    row.claim = "mutation"
    with pytest.raises(Exception):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_duplicate_entry_id_is_rejected(db_session):
    await postgres_evidence_store.append(db_session, make_entry())
    with pytest.raises(Exception):
        await postgres_evidence_store.append(db_session, make_entry(digest="b" * 64))
    await db_session.rollback()
