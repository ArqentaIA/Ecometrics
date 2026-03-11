
-- 1. Validar que kg_brutos no sea negativo (trigger en vez de CHECK para flexibilidad)
CREATE OR REPLACE FUNCTION public.validate_material_capture()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- kg_brutos no negativo
  IF NEW.kg_brutos < 0 THEN
    RAISE EXCEPTION 'kg_brutos no puede ser negativo: %', NEW.kg_brutos;
  END IF;

  -- material_code no vacío
  IF NEW.material_code IS NULL OR trim(NEW.material_code) = '' THEN
    RAISE EXCEPTION 'material_code no puede estar vacío';
  END IF;

  -- material_code debe ser uno válido del catálogo
  IF NEW.material_code NOT IN (
    'CARTON', 'PET', 'PET VERDE', 'HDPP', 'LECHERO',
    'ARCHIVO BCO', 'COLOR', 'CAPLE', 'A. MUERTO',
    'FIERRO', 'ALUM BOTE', 'ALUM MACIZO', 'VIDRIO',
    'SUERO', 'taprosca', 'bolsa plastico'
  ) THEN
    RAISE EXCEPTION 'material_code inválido: %', NEW.material_code;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger de validación
DROP TRIGGER IF EXISTS trg_validate_material_capture ON public.material_captures;
CREATE TRIGGER trg_validate_material_capture
  BEFORE INSERT OR UPDATE ON public.material_captures
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_material_capture();

-- 2. Índice para consultas frecuentes por usuario + periodo
CREATE INDEX IF NOT EXISTS idx_captures_user_period
  ON public.material_captures (user_id, year, month);

-- 3. Índice para reportes por periodo (admin)
CREATE INDEX IF NOT EXISTS idx_captures_period
  ON public.material_captures (year, month);
