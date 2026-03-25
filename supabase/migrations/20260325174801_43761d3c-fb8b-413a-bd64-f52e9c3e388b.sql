-- Disable user-defined audit triggers by name
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Ajustar uses_agua = false para celulósicos, metales y vidrio
UPDATE material_catalog SET uses_agua = false, updated_at = now()
WHERE code IN (
  'CARTON', 'PERIODICO', 'ARCHIVO BCO', 'COLOR', 'CAPLE', 'A. MUERTO', 'LECHERO',
  'FIERRO', 'ALUM BOTE', 'ALUM MACIZO',
  'VIDRIO'
) AND uses_agua = true;

-- Re-enable audit triggers
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_material_catalog;