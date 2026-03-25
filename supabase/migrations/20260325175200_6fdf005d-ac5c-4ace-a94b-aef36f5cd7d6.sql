-- Disable audit triggers to allow migration without auth context
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Reclasificar SUERO como plástico y habilitar uses_energia
UPDATE material_catalog
SET family = 'plastico',
    uses_energia = true,
    updated_at = now()
WHERE code = 'SUERO';

-- Re-enable audit triggers
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_material_catalog;