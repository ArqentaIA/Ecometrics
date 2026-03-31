-- Disable user triggers to allow cleanup without auth context
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures DISABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures DISABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures DISABLE TRIGGER trg_validate_material_capture;

-- Remove duplicate unconfirmed Excel imports, keeping only the most recent per material
DELETE FROM material_captures
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, material_code, month, year
             ORDER BY created_at DESC
           ) as rn
    FROM material_captures
    WHERE is_confirmed = false
      AND capture_origin = 'excel_upload'
  ) ranked
  WHERE rn > 1
);

-- Re-enable all triggers
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_capture_confirm;
ALTER TABLE material_captures ENABLE TRIGGER trg_audit_material_captures;
ALTER TABLE material_captures ENABLE TRIGGER trg_generate_capture_folio;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_kg_netos;
ALTER TABLE material_captures ENABLE TRIGGER trg_validate_material_capture;