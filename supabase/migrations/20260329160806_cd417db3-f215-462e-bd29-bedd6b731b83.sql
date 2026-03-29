-- Disable audit triggers to avoid auth.uid() errors during cleanup
ALTER TABLE material_captures DISABLE TRIGGER USER;

-- Delete all test captures
DELETE FROM material_captures;

-- Delete related audit and report logs (generated from test data)
DELETE FROM audit_log;
DELETE FROM report_audit_log;

-- Re-enable triggers
ALTER TABLE material_captures ENABLE TRIGGER USER;