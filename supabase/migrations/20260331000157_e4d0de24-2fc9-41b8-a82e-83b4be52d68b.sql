-- Disable audit triggers that require auth.uid()
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Enable uses_agua for CRE-001 and REVOLTURA
UPDATE public.material_catalog
SET uses_agua = true, updated_at = now()
WHERE code IN ('CRE-001', 'REVOLTURA');

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;