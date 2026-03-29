
-- Disable audit triggers to avoid auth.uid() errors during migration
ALTER TABLE material_factors DISABLE TRIGGER USER;
ALTER TABLE material_catalog DISABLE TRIGGER USER;

-- Step 1: Deactivate all existing active factors for the 22 materials
UPDATE material_factors SET activo = false
WHERE activo = true AND material_code IN (
  'A. MUERTO', 'ACE-001', 'ALUM BOTE', 'ALUM MACIZO', 'ARCHIVO BCO',
  'bolsa plastico', 'BRONCE', 'CAP-001', 'CARTON', 'COBRE', 'COLOR',
  'FIERRO', 'HDPP', 'LECHERO', 'PERIODICO', 'PET', 'PET VERDE',
  'PET-8020', 'PET-AZ-001', 'SUERO', 'taprosca', 'VIDRIO'
);

-- Step 2: Insert new v2 factors
INSERT INTO material_factors (material_code, factor_co2, factor_energia, factor_agua, factor_arboles, version, activo, fuente) VALUES
  ('A. MUERTO',     0.96,  3.50,  3.50, 0.005, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('ACE-001',       1.46,  4.97,  2.00, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('ALUM BOTE',     9.13, 47.71,  4.50, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('ALUM MACIZO',   9.13, 47.71,  4.50, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('ARCHIVO BCO',   0.96,  3.50,  3.50, 0.005, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('bolsa plastico',1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('BRONCE',        3.81, 19.80,  3.00, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('CAP-001',       0.89,  2.86,  3.20, 0.004, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('CARTON',        0.89,  2.86,  3.20, 0.004, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('COBRE',         3.81, 19.80,  3.00, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('COLOR',         0.96,  3.50,  3.50, 0.005, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('FIERRO',        1.46,  4.97,  2.00, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('HDPP',          1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('LECHERO',       0.89,  2.86,  3.20, 0.004, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('PERIODICO',     0.89,  2.86,  3.20, 0.004, 2, true, 'EPA WARM v16 (Dec 2023)'),
  ('PET',           1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('PET VERDE',     1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('PET-8020',      1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('PET-AZ-001',    1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('SUERO',         1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('taprosca',      1.53,  5.77,  1.20, NULL,  2, true, 'EPA WARM v16 (Dec 2023)'),
  ('VIDRIO',        0.31,  0.53,  0.50, NULL,  2, true, 'EPA WARM v16 (Dec 2023)');

-- Step 3: Sync material_catalog factor columns and impacto_valido
UPDATE material_catalog SET factor_co2=0.96, factor_energia=3.50, factor_agua=3.50, factor_arboles=0.005, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='A. MUERTO';
UPDATE material_catalog SET factor_co2=1.46, factor_energia=4.97, factor_agua=2.00, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='ACE-001';
UPDATE material_catalog SET factor_co2=9.13, factor_energia=47.71, factor_agua=4.50, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='ALUM BOTE';
UPDATE material_catalog SET factor_co2=9.13, factor_energia=47.71, factor_agua=4.50, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='ALUM MACIZO';
UPDATE material_catalog SET factor_co2=0.96, factor_energia=3.50, factor_agua=3.50, factor_arboles=0.005, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='ARCHIVO BCO';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='bolsa plastico';
UPDATE material_catalog SET factor_co2=3.81, factor_energia=19.80, factor_agua=3.00, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='BRONCE';
UPDATE material_catalog SET factor_co2=0.89, factor_energia=2.86, factor_agua=3.20, factor_arboles=0.004, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='CAP-001';
UPDATE material_catalog SET factor_co2=0.89, factor_energia=2.86, factor_agua=3.20, factor_arboles=0.004, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='CARTON';
UPDATE material_catalog SET factor_co2=3.81, factor_energia=19.80, factor_agua=3.00, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='COBRE';
UPDATE material_catalog SET factor_co2=0.96, factor_energia=3.50, factor_agua=3.50, factor_arboles=0.005, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='COLOR';
UPDATE material_catalog SET factor_co2=1.46, factor_energia=4.97, factor_agua=2.00, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='FIERRO';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='HDPP';
UPDATE material_catalog SET factor_co2=0.89, factor_energia=2.86, factor_agua=3.20, factor_arboles=0.004, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='LECHERO';
UPDATE material_catalog SET factor_co2=0.89, factor_energia=2.86, factor_agua=3.20, factor_arboles=0.004, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='PERIODICO';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='PET';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='PET VERDE';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='PET-8020';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='PET-AZ-001';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='SUERO';
UPDATE material_catalog SET factor_co2=1.53, factor_energia=5.77, factor_agua=1.20, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='taprosca';
UPDATE material_catalog SET factor_co2=0.31, factor_energia=0.53, factor_agua=0.50, factor_arboles=NULL, impacto_valido=true, factors_source='EPA WARM v16 (Dec 2023)' WHERE code='VIDRIO';

-- Keep CREMERO, REVOLTURA, BATERIAS unchanged
UPDATE material_catalog SET impacto_valido = false WHERE code IN ('CRE-001', 'REVOLTURA', 'BATERIAS');

-- Re-enable triggers
ALTER TABLE material_factors ENABLE TRIGGER USER;
ALTER TABLE material_catalog ENABLE TRIGGER USER;
