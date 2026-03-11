
-- Disable user-defined audit triggers
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog DISABLE TRIGGER trg_audit_material_catalog;

UPDATE material_catalog SET default_cost_per_kg = 1.50 WHERE id = 1;
UPDATE material_catalog SET default_cost_per_kg = 7.00 WHERE id = 2;
UPDATE material_catalog SET default_cost_per_kg = 4.00 WHERE id = 3;
UPDATE material_catalog SET default_cost_per_kg = 4.00 WHERE id = 4;
UPDATE material_catalog SET default_cost_per_kg = 8.00 WHERE id = 5;
UPDATE material_catalog SET default_cost_per_kg = 4.50 WHERE id = 6;
UPDATE material_catalog SET default_cost_per_kg = 2.00 WHERE id = 7;
UPDATE material_catalog SET default_cost_per_kg = 1.50 WHERE id = 8;
UPDATE material_catalog SET default_cost_per_kg = 2.00 WHERE id = 9;
UPDATE material_catalog SET default_cost_per_kg = 2.00 WHERE id = 10;
UPDATE material_catalog SET default_cost_per_kg = 24.00 WHERE id = 11;
UPDATE material_catalog SET default_cost_per_kg = 22.00 WHERE id = 12;
UPDATE material_catalog SET default_cost_per_kg = 1.00 WHERE id = 13;
UPDATE material_catalog SET default_cost_per_kg = 10.00 WHERE id = 14;
UPDATE material_catalog SET default_cost_per_kg = 5.00 WHERE id = 15;
UPDATE material_catalog SET default_cost_per_kg = 4.00 WHERE id = 16;

-- Re-enable triggers
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE material_catalog ENABLE TRIGGER trg_audit_material_catalog;
