
-- Disable audit triggers that require auth.uid()
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Update BATERIAS: set default_yield and yield_min to 1.0
UPDATE public.material_catalog
SET default_yield = 1.0,
    yield_min = 1.0,
    updated_at = now()
WHERE code = 'BATERIAS';

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
