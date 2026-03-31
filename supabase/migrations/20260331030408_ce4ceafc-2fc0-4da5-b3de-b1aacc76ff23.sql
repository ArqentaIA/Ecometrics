
-- Disable triggers to avoid auth.uid() errors during migration cleanup
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures DISABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_material_capture;

-- Delete all excel_upload records
DELETE FROM material_captures WHERE capture_origin = 'excel_upload';

-- Re-enable triggers
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures ENABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_material_capture;
