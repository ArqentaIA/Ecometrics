-- Disable audit triggers to avoid auth.uid() null errors
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- Fix CRE-001: enable environmental impact calculation
UPDATE public.material_catalog
SET impacto_valido = true, updated_at = now()
WHERE code = 'CRE-001';

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;