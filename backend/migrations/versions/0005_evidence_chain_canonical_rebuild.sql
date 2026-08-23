-- ArchOS evidence chain migration 0005
-- Rebuilds chain digests using the exact canonical representation used by
-- backend/agents/evidence_persistence.py. This corrects legacy backfill
-- serialization differences without rewriting evidence content.

DO $$
DECLARE
    r RECORD;
    previous VARCHAR(64) := NULL;
    calculated VARCHAR(64);
    canonical TEXT;
BEGIN
    FOR r IN
        SELECT id, entry_id, task_id, agent_id, source, claim, evidence,
               confidence, reality, created_at, digest
        FROM archos_evidence_ledger
        ORDER BY id ASC
        FOR UPDATE
    LOOP
        canonical := json_build_object(
            'agent_id', r.agent_id,
            'claim', r.claim,
            'confidence', round(r.confidence::numeric, 12),
            'created_at', r.created_at,
            'digest', r.digest,
            'entry_id', r.entry_id,
            'evidence', COALESCE(r.evidence, '[]'::jsonb),
            'previous_digest', previous,
            'reality', r.reality,
            'source', r.source,
            'task_id', r.task_id
        )::text;

        -- json_build_object emits stable key insertion order here, matching
        -- the canonical field order expected by the persistence adapter's
        -- migration-compatible representation.
        calculated := encode(digest(canonical, 'sha256'), 'hex');

        UPDATE archos_evidence_ledger
        SET previous_digest = previous,
            chain_digest = calculated
        WHERE id = r.id;

        previous := calculated;
    END LOOP;

    UPDATE archos_evidence_chain_state
    SET latest_digest = previous,
        updated_at = NOW()
    WHERE chain_name = 'default';
END $$;
