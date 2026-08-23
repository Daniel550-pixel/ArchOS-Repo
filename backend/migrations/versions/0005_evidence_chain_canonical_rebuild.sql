-- ArchOS evidence chain migration 0005
-- Rebuilds chain digests using the exact language-neutral framed representation
-- implemented by backend/agents/evidence_persistence.py.

DO $$
DECLARE
    r RECORD;
    previous VARCHAR(64) := NULL;
    calculated VARCHAR(64);
    evidence_framed TEXT;
    canonical TEXT;
    confidence_text TEXT;
    timestamp_text TEXT;
BEGIN
    FOR r IN
        SELECT id, entry_id, task_id, agent_id, source, claim, evidence,
               confidence, reality, created_at, digest
        FROM archos_evidence_ledger
        ORDER BY id ASC
        FOR UPDATE
    LOOP
        SELECT COALESCE(string_agg(
            length(convert_to(value, 'UTF8'))::text || ':' || value,
            '' ORDER BY ordinality
        ), '')
        INTO evidence_framed
        FROM jsonb_array_elements_text(COALESCE(r.evidence::jsonb, '[]'::jsonb)) WITH ORDINALITY;

        confidence_text := to_char(round(r.confidence::numeric, 12), 'FM999999999999990.000000000000');
        timestamp_text := to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');

        canonical :=
            length(convert_to(r.entry_id, 'UTF8'))::text || ':' || r.entry_id ||
            length(convert_to(r.task_id, 'UTF8'))::text || ':' || r.task_id ||
            length(convert_to(r.agent_id, 'UTF8'))::text || ':' || r.agent_id ||
            length(convert_to(r.source, 'UTF8'))::text || ':' || r.source ||
            length(convert_to(r.claim, 'UTF8'))::text || ':' || r.claim ||
            evidence_framed ||
            length(convert_to(confidence_text, 'UTF8'))::text || ':' || confidence_text ||
            length(convert_to(r.reality, 'UTF8'))::text || ':' || r.reality ||
            length(convert_to(timestamp_text, 'UTF8'))::text || ':' || timestamp_text ||
            length(convert_to(r.digest, 'UTF8'))::text || ':' || r.digest ||
            length(convert_to(COALESCE(previous, ''), 'UTF8'))::text || ':' || COALESCE(previous, '');

        calculated := encode(digest(convert_to(canonical, 'UTF8'), 'sha256'), 'hex');
        UPDATE archos_evidence_ledger SET previous_digest = previous, chain_digest = calculated WHERE id = r.id;
        previous := calculated;
    END LOOP;

    UPDATE archos_evidence_chain_state
    SET latest_digest = previous, updated_at = NOW()
    WHERE chain_name = 'default';
END $$;
