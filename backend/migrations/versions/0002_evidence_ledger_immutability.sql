-- ArchOS evidence ledger migration 0002
-- Database-enforced append-only semantics and tamper-evident audit trail.

CREATE TABLE IF NOT EXISTS archos_evidence_ledger_audit (
    audit_id BIGSERIAL PRIMARY KEY,
    entry_id VARCHAR(80) NOT NULL,
    operation VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    row_digest VARCHAR(64) NOT NULL
);

CREATE OR REPLACE FUNCTION archos_evidence_ledger_prevent_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'archos_evidence_ledger is append-only; % is prohibited', TG_OP
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_archos_evidence_no_update ON archos_evidence_ledger;
CREATE TRIGGER trg_archos_evidence_no_update
BEFORE UPDATE ON archos_evidence_ledger
FOR EACH ROW EXECUTE FUNCTION archos_evidence_ledger_prevent_mutation();

DROP TRIGGER IF EXISTS trg_archos_evidence_no_delete ON archos_evidence_ledger;
CREATE TRIGGER trg_archos_evidence_no_delete
BEFORE DELETE ON archos_evidence_ledger
FOR EACH ROW EXECUTE FUNCTION archos_evidence_ledger_prevent_mutation();

CREATE OR REPLACE FUNCTION archos_evidence_ledger_audit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO archos_evidence_ledger_audit(entry_id, operation, row_digest)
    VALUES (NEW.entry_id, 'INSERT', NEW.digest);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_archos_evidence_audit_insert ON archos_evidence_ledger;
CREATE TRIGGER trg_archos_evidence_audit_insert
AFTER INSERT ON archos_evidence_ledger
FOR EACH ROW EXECUTE FUNCTION archos_evidence_ledger_audit_insert();

CREATE INDEX IF NOT EXISTS ix_archos_evidence_audit_entry_id
    ON archos_evidence_ledger_audit (entry_id);
CREATE INDEX IF NOT EXISTS ix_archos_evidence_audit_occurred_at
    ON archos_evidence_ledger_audit (occurred_at);

-- Production database roles should additionally REVOKE UPDATE/DELETE on
-- archos_evidence_ledger from the application role. The trigger is defense in depth.
