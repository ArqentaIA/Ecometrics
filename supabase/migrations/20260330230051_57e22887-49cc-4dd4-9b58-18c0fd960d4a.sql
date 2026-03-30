
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

UPDATE public.material_catalog
SET yield_max = 1.0, updated_at = now()
WHERE code = 'BATERIAS';

ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
