-- Migration: Merge "CARTON DELGADO" (code=CAPLE) into "CAPLE" (code=CAP-001)

-- Disable user triggers on affected tables
ALTER TABLE material_captures DISABLE TRIGGER USER;
ALTER TABLE material_factors DISABLE TRIGGER USER;
ALTER TABLE material_catalog DISABLE TRIGGER USER;

-- Step 1: Remap captures
UPDATE material_captures
SET material_code = 'CAP-001',
    material_name = 'CAPLE'
WHERE material_code = 'CAPLE';

-- Step 2: Remap factor versions
UPDATE material_factors
SET material_code = 'CAP-001'
WHERE material_code = 'CAPLE';

-- Step 3: Delete old catalog entry (CARTON DELGADO, code=CAPLE, id=8)
DELETE FROM material_catalog WHERE code = 'CAPLE' AND id = 8;

-- Re-enable user triggers
ALTER TABLE material_captures ENABLE TRIGGER USER;
ALTER TABLE material_factors ENABLE TRIGGER USER;
ALTER TABLE material_catalog ENABLE TRIGGER USER;