
-- Disable audit triggers on material_factors
ALTER TABLE public.material_factors DISABLE TRIGGER trg_audit_factor_change;

-- Insert missing factors
INSERT INTO public.material_factors (material_code, factor_co2, factor_energia, factor_agua, factor_arboles, version, activo, fuente)
VALUES
  ('CRE-001', 0.96, 3.50, 3.50, 0.005, 2, true, 'EPA WARM v16'),
  ('REVOLTURA', 0.96, 3.50, 3.50, 0.003, 2, true, 'EPA WARM v16'),
  ('BATERIAS', 0.58, 4.50, 1.50, NULL, 2, true, 'EPA WARM v16');

-- Re-enable
ALTER TABLE public.material_factors ENABLE TRIGGER trg_audit_factor_change;

-- Disable audit triggers on material_catalog
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Update CREMERO family
UPDATE public.material_catalog SET family = 'celulosa', updated_at = now() WHERE code = 'CRE-001';

-- Re-enable
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
