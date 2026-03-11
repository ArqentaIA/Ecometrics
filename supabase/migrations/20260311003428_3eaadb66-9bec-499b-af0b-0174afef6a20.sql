
CREATE OR REPLACE FUNCTION public.validate_material_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.kg_brutos < 0 THEN
    RAISE EXCEPTION 'kg_brutos no puede ser negativo: %', NEW.kg_brutos;
  END IF;

  IF NEW.material_code IS NULL OR trim(NEW.material_code) = '' THEN
    RAISE EXCEPTION 'material_code no puede estar vacío';
  END IF;

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
