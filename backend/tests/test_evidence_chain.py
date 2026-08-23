"""Regression tests for evidence-chain integrity semantics."""
from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from backend.agents.base import RealityLevel
from backend.agents.evidence_persistence import EvidenceBase, EvidenceModel, postgres_evidence_store


@pytest.mark.asyncio
async def test_valid_chain(db_session):
    await postgres_evidence_store.append(
        db_session,
        task_id="task-1",
        agent_id="agent-a",
        source="source-a",
        claim="claim-a",
        evidence=["evidence-a"],
        confidence=0.9,
        reality=RealityLevel.OBSERVED,
        created_at=datetime.now(timezone.utc),
        entry_id="entry-a",
        digest="a" * 64,
    )
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is True
    assert result["entries_checked"] == 1


@pytest.mark.asyncio
async def test_changed_claim_fails_chain(db_session):
    await postgres_evidence_store.append(
        db_session, "task-1", "agent-a", "source-a", "claim-a", ["evidence-a"],
        0.9, RealityLevel.OBSERVED, datetime.now(timezone.utc), "entry-a", "a" * 64,
    )
    row = (await db_session.execute(select(EvidenceModel).where(EvidenceModel.entry_id == "entry-a"))).scalar_one()
    row.claim = "tampered"
    await db_session.commit()
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False
    assert any("chain digest mismatch" in failure for failure in result["failures"])


@pytest.mark.asyncio
async def test_changed_evidence_fails_chain(db_session):
    await postgres_evidence_store.append(
        db_session, "task-1", "agent-a", "source-a", "claim-a", ["evidence-a"],
        0.9, RealityLevel.OBSERVED, datetime.now(timezone.utc), "entry-a", "a" * 64,
    )
    row = (await db_session.execute(select(EvidenceModel).where(EvidenceModel.entry_id == "entry-a"))).scalar_one()
    row.evidence = ["tampered"]
    await db_session.commit()
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False


@pytest.mark.asyncio
async def test_changed_digest_fails_chain(db_session):
    await postgres_evidence_store.append(
        db_session, "task-1", "agent-a", "source-a", "claim-a", ["evidence-a"],
        0.9, RealityLevel.OBSERVED, datetime.now(timezone.utc), "entry-a", "a" * 64,
    )
    row = (await db_session.execute(select(EvidenceModel).where(EvidenceModel.entry_id == "entry-a"))).scalar_one()
    row.digest = "b" * 64
    await db_session.commit()
    result = await postgres_evidence_store.verify_chain(db_session)
    assert result["valid"] is False


@pytest.mark.asyncio
async def test_append_only_rejects_update(db_session):
    await postgres_evidence_store.append(
        db_session, "task-1", "agent-a", "source-a", "claim-a", ["evidence-a"],
        0.9, RealityLevel.OBSERVED, datetime.now(timezone.utc), "entry-a", "a" * 64,
    )
    row = (await db_session.execute(select(EvidenceModel).where(EvidenceModel.entry_id == "entry-a"))).scalar_one()
    row.claim = "mutation"
    with pytest.raises(Exception):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_duplicate_entry_is_rejected(db_session):
    kwargs = dict(task_id="task-1", agent_id="agent-a", source="source-a", claim="claim-a", evidence=["e"], confidence=0.9, reality=RealityLevel.OBSERVED, created_at=datetime.now(timezone.utc), entry_id="entry-a", digest="a" * 64)
    await postgres_evidence_store.append(db_session, **kwargs)
    with pytest.raises(Exception):
        await postgres_evidence_store.append(db_session, **kwargs)
