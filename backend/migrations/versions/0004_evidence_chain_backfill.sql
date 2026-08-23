-- ArchOS evidence chain migration 0004
-- Controlled one-time backfill for pre-chain evidence rows.
--
-- This migration is intentionally NOT automatic application startup logic.
-- Run it only after 0001-0003 have been reviewed/applied.

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
        WHERE chain_digest IS NULL
        ORDER BY id ASC
        FOR UPDATE
    LOOP
        canonical := json_build_object(
            'entry_id', r.entry_id,
            'task_id', r.task_id,
            'agent_id', r.agent_id,
            'source', r.source,
            'claim', r.claim,
            'evidence', COALESCE(r.evidence, '[]'::jsonb),
            'confidence', round(r.confidence::numeric, 12),
            'reality', r.reality,
            'created_at', r.created_at,
            'digest', r.digest,
            'previous_digest', previous
        )::text;

        calculated := encode(digest(canonical, 'sha256'), 'hex');

        UPDATE archos_evidence_ledger
        SET previous_digest = previous,
            chain_digest = calculated
        WHERE id = r.id;

        previous := calculated;
    END LOOP;

    INSERT INTO archos_evidence_chain_state(chain_name, latest_digest, updated_at)
    VALUES ('default', previous, NOW())
    ON CONFLICT (chain_name) DO UPDATE
      SET latest_digest = EXCLUDED.latest_digest,
          updated_at = EXCLUDED.updated_at;
END $$;

-- The migration runner must call the application verification endpoint or
-- equivalent SQL verification after this migration and fail deployment if the
-- resulting chain is invalid.
