
-- Disable triggers to avoid auth.uid() errors during migration cleanup
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures DISABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_material_capture;

-- Delete manual confirmed records for March 2026
DELETE FROM material_captures 
WHERE capture_origin = 'manual' 
  AND is_confirmed = true 
  AND month = 3 
  AND year = 2026;

-- Re-enable triggers
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures ENABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_material_capture;
