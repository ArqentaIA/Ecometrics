
-- =====================================================
-- CAPA 2: EXPANDIR material_captures CON SNAPSHOT
-- =====================================================

-- Snapshot columns for frozen methodology
ALTER TABLE public.material_captures
  ADD COLUMN IF NOT EXISTS material_name text,
  ADD COLUMN IF NOT EXISTS family text,
  ADD COLUMN IF NOT EXISTS yield_applied numeric,
  ADD COLUMN IF NOT EXISTS kg_netos numeric,
  ADD COLUMN IF NOT EXISTS factor_arboles_applied numeric,
  ADD COLUMN IF NOT EXISTS factor_co2_applied numeric,
  ADD COLUMN IF NOT EXISTS factor_energia_applied numeric,
  ADD COLUMN IF NOT EXISTS factor_agua_applied numeric,
  ADD COLUMN IF NOT EXISTS uses_arboles boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uses_co2 boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS uses_energia boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS uses_agua boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS result_arboles numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_co2 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_energia numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_agua numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT false;

-- Update validation trigger to check against catalog table
CREATE OR REPLACE FUNCTION public.validate_material_capture()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate positive weight
  IF NEW.kg_brutos < 0 THEN
    RAISE EXCEPTION 'kg_brutos no puede ser negativo: %', NEW.kg_brutos;
  END IF;

  -- Validate material_code is not empty
  IF NEW.material_code IS NULL OR trim(NEW.material_code) = '' THEN
    RAISE EXCEPTION 'material_code no puede estar vacío';
  END IF;

  -- Validate against catalog (dynamic, not hardcoded)
  IF NOT EXISTS (
    SELECT 1 FROM public.material_catalog
    WHERE code = NEW.material_code AND is_active = true
  ) THEN
    RAISE EXCEPTION 'material_code inválido o inactivo: %', NEW.material_code;
  END IF;

  -- Auto-calculate snapshot if yield is provided but results are missing
  IF NEW.yield_applied IS NOT NULL AND NEW.kg_netos IS NULL THEN
    NEW.kg_netos := NEW.kg_brutos * (NEW.yield_applied / 100);
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_validate_material_capture ON public.material_captures;
CREATE TRIGGER trg_validate_material_capture
  BEFORE INSERT OR UPDATE ON public.material_captures
  FOR EACH ROW EXECUTE FUNCTION public.validate_material_capture();
