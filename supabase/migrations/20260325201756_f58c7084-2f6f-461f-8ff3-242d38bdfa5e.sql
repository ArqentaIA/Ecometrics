-- Disable only user-defined audit triggers
ALTER TABLE public.material_catalog DISABLE TRIGGER USER;

-- Normalize default_yield, yield_min, yield_max to 0-1 decimal scale
UPDATE public.material_catalog SET default_yield = default_yield / 100 WHERE default_yield > 1;
UPDATE public.material_catalog SET yield_min = yield_min / 100 WHERE yield_min > 1;
UPDATE public.material_catalog SET yield_max = yield_max / 100 WHERE yield_max > 1;

-- Re-enable user triggers
ALTER TABLE public.material_catalog ENABLE TRIGGER USER;

-- Add validation trigger to enforce 0-1 range going forward
CREATE OR REPLACE FUNCTION public.validate_yield_range()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.default_yield < 0 OR NEW.default_yield > 1 THEN
    RAISE EXCEPTION 'default_yield must be between 0 and 1';
  END IF;
  IF NEW.yield_min < 0 OR NEW.yield_min > 1 THEN
    RAISE EXCEPTION 'yield_min must be between 0 and 1';
  END IF;
  IF NEW.yield_max < 0 OR NEW.yield_max > 1 THEN
    RAISE EXCEPTION 'yield_max must be between 0 and 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_yield_range
BEFORE INSERT OR UPDATE ON public.material_catalog
FOR EACH ROW EXECUTE FUNCTION public.validate_yield_range();