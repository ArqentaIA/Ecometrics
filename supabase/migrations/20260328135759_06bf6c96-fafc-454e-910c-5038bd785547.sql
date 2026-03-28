
-- Silent validation trigger for kg_netos consistency
CREATE OR REPLACE FUNCTION public.fn_validate_kg_netos_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _expected numeric;
  _diff numeric;
  _tolerance numeric := 0.01;
  _user_id uuid;
  _role text;
BEGIN
  -- Rule: BATERIAS has kg_netos = 0, skip validation
  IF NEW.material_code = 'BATERIAS' THEN
    RETURN NEW;
  END IF;

  -- Rule: If kg_brutos or yield_applied is NULL, force kg_netos to NULL
  IF NEW.kg_brutos IS NULL OR NEW.yield_applied IS NULL THEN
    NEW.kg_netos := NULL;
    RETURN NEW;
  END IF;

  -- Calculate expected value
  _expected := NEW.kg_brutos * NEW.yield_applied;

  -- If kg_netos was not provided, don't block (already handled by existing trigger)
  IF NEW.kg_netos IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check consistency within tolerance
  _diff := ABS(NEW.kg_netos - _expected);

  IF _diff > _tolerance THEN
    -- Log warning silently without blocking
    BEGIN
      _user_id := COALESCE(auth.uid(), NEW.user_id);
      SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;

      INSERT INTO public.audit_log (
        table_name, record_id, event_type, field_changed,
        old_value, new_value, user_id, user_role, comment
      ) VALUES (
        'material_captures', COALESCE(NEW.id::text, 'new'),
        'VALIDATION_WARNING', 'kg_netos',
        _expected::text, NEW.kg_netos::text,
        _user_id, _role,
        'Inconsistencia kg_netos: esperado=' || round(_expected, 4)::text || ' recibido=' || round(NEW.kg_netos, 4)::text || ' diff=' || round(_diff, 4)::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block the capture even if audit insert fails
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger (drop if exists to be safe)
DROP TRIGGER IF EXISTS trg_validate_kg_netos ON public.material_captures;
CREATE TRIGGER trg_validate_kg_netos
  BEFORE INSERT OR UPDATE ON public.material_captures
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_kg_netos_consistency();
