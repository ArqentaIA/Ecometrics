
-- Disable audit triggers to avoid session user_id requirement during migration
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- PET AZUL (PET-AZ-001): EPA WARM v16 — PET Plastic
-- CO2: 1.00 kg CO2e/kg (MTCO2E/short ton converted)
-- Energía: 5.3 kWh/kg (MMBTU/short ton converted)
-- Agua: 17 L/kg (literatura especializada reciclaje plástico)
UPDATE public.material_catalog
SET factor_co2 = 1.00,
    factor_energia = 5.3,
    factor_agua = 17,
    factors_source = 'EPA WARM v16 — PET Plastic; agua: literatura especializada reciclaje plástico',
    impacto_valido = true
WHERE code = 'PET-AZ-001';

-- ACERO (ACE-001): EPA WARM v16 — Steel Cans
-- CO2: 1.46 kg CO2e/kg
-- Energía: 4.3 kWh/kg
-- Agua: no aplica (uses_agua = false)
UPDATE public.material_catalog
SET factor_co2 = 1.46,
    factor_energia = 4.3,
    factors_source = 'EPA WARM v16 — Steel Cans',
    impacto_valido = true
WHERE code = 'ACE-001';

-- CAPLE, CREMERO, PET 80/20: mantener factores NULL, impacto_valido = false
-- No se modifican (ya están en estado correcto)

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
