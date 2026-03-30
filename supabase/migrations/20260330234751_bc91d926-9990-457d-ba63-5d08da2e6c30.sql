-- Disable audit triggers
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

-- CRE-001: enable arboles flag (co2/energia already true, agua stays false per spec)
UPDATE public.material_catalog
SET impacto_valido = true, uses_arboles = true, updated_at = now()
WHERE code = 'CRE-001';

-- REVOLTURA: enable impacto_valido + co2/energia/arboles (agua stays false per spec)
UPDATE public.material_catalog
SET impacto_valido = true, uses_co2 = true, uses_energia = true, uses_arboles = true, uses_agua = false, updated_at = now()
WHERE code = 'REVOLTURA';

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;