ALTER TABLE material_catalog DISABLE TRIGGER USER;
UPDATE material_catalog SET uses_agua = false, updated_at = now() WHERE code = 'CRE-001';
ALTER TABLE material_catalog ENABLE TRIGGER USER;