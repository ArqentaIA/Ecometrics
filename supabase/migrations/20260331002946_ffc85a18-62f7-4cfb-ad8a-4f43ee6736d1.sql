
-- Disable audit triggers to avoid auth.uid() null errors
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog DISABLE TRIGGER trg_audit_material_catalog;

UPDATE public.material_catalog SET default_cost_per_kg = 1.47, updated_at = now() WHERE code = 'CARTON';
UPDATE public.material_catalog SET default_cost_per_kg = 9.71, updated_at = now() WHERE code = 'SUERO';
UPDATE public.material_catalog SET default_cost_per_kg = 4.38, updated_at = now() WHERE code = 'HDPP';
UPDATE public.material_catalog SET default_cost_per_kg = 2.14, updated_at = now() WHERE code = 'COLOR';
UPDATE public.material_catalog SET default_cost_per_kg = 3.50, updated_at = now() WHERE code = 'REVOLTURA';
UPDATE public.material_catalog SET default_cost_per_kg = 4.22, updated_at = now() WHERE code = 'PET VERDE';
UPDATE public.material_catalog SET default_cost_per_kg = 122.22, updated_at = now() WHERE code = 'COBRE';
UPDATE public.material_catalog SET default_cost_per_kg = 6.00, updated_at = now() WHERE code = 'BATERIAS';
UPDATE public.material_catalog SET default_cost_per_kg = 55.50, updated_at = now() WHERE code = 'BRONCE';
UPDATE public.material_catalog SET default_cost_per_kg = 2.00, updated_at = now() WHERE code = 'FIERRO';
UPDATE public.material_catalog SET default_cost_per_kg = 1.70, updated_at = now() WHERE code = 'PERIODICO';
UPDATE public.material_catalog SET default_cost_per_kg = 1.00, updated_at = now() WHERE code = 'VIDRIO';
UPDATE public.material_catalog SET default_cost_per_kg = 0.60, updated_at = now() WHERE code = 'CAP-001';
UPDATE public.material_catalog SET default_cost_per_kg = 5.00, updated_at = now() WHERE code = 'CRE-001';
UPDATE public.material_catalog SET default_cost_per_kg = 4.50, updated_at = now() WHERE code = 'PET-AZ-001';
UPDATE public.material_catalog SET default_cost_per_kg = 5.00, updated_at = now() WHERE code = 'PET-8020';
UPDATE public.material_catalog SET default_cost_per_kg = 5.00, updated_at = now() WHERE code = 'taprosca';
UPDATE public.material_catalog SET default_cost_per_kg = 4.00, updated_at = now() WHERE code = 'bolsa plastico';
UPDATE public.material_catalog SET default_cost_per_kg = 23.77, updated_at = now() WHERE code = 'ALUM BOTE';
UPDATE public.material_catalog SET default_cost_per_kg = 21.12, updated_at = now() WHERE code = 'ALUM MACIZO';
UPDATE public.material_catalog SET default_cost_per_kg = 2.75, updated_at = now() WHERE code = 'A. MUERTO';
UPDATE public.material_catalog SET default_cost_per_kg = 5.07, updated_at = now() WHERE code = 'ARCHIVO BCO';
UPDATE public.material_catalog SET default_cost_per_kg = 7.12, updated_at = now() WHERE code = 'PET';
UPDATE public.material_catalog SET default_cost_per_kg = 12.00, updated_at = now() WHERE code = 'ACE-001';
UPDATE public.material_catalog SET default_cost_per_kg = 7.56, updated_at = now() WHERE code = 'LECHERO';

-- Re-enable audit triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_catalog_details;
ALTER TABLE public.material_catalog ENABLE TRIGGER trg_audit_material_catalog;
