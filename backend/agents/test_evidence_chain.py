"""Unit tests for deterministic evidence-chain integrity."""
from datetime import datetime, timezone

from .base import AgentResult, RealityLevel
from .evidence_ledger import EvidenceEntry
from .evidence_persistence import calculate_chain_digest, canonical_chain_payload


def _entry(digest: str = "a" * 64) -> EvidenceEntry:
    return EvidenceEntry(
        entry_id="evidence-001",
        task_id="task-001",
        agent_id="agent-001",
        source="test-source",
        claim="test claim",
        evidence=("evidence-1",),
        confidence=0.91,
        reality=RealityLevel.OBSERVED,
        created_at=datetime(2026, 8, 23, tzinfo=timezone.utc).isoformat(),
        digest=digest,
    )


def test_chain_digest_is_deterministic():
    entry = _entry()
    assert calculate_chain_digest(entry, None) == calculate_chain_digest(entry, None)


def test_previous_digest_changes_chain_digest():
    entry = _entry()
    first = calculate_chain_digest(entry, None)
    second = calculate_chain_digest(entry, "b" * 64)
    assert first != second


def test_canonical_payload_is_stable_and_sorted():
    payload = canonical_chain_payload(_entry(), None)
    assert payload.index('"agent_id"') < payload.index('"task_id"')
    assert "previous_digest" in payload


def test_evidence_mutation_changes_digest():
    original = _entry()
    mutated = EvidenceEntry(**{**original.__dict__, "claim": "tampered claim"})
    assert calculate_chain_digest(original, None) != calculate_chain_digest(mutated, None)
