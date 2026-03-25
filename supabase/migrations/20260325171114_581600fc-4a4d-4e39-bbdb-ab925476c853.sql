
-- 1. Add impacto_valido flag to material_catalog
ALTER TABLE public.material_catalog 
  ADD COLUMN IF NOT EXISTS impacto_valido boolean NOT NULL DEFAULT true;

-- 2. Create versioned factors table
CREATE TABLE IF NOT EXISTS public.material_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code text NOT NULL,
  factor_co2 numeric,
  factor_energia numeric,
  factor_agua numeric,
  factor_arboles numeric,
  version integer NOT NULL DEFAULT 1,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  fuente text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  notas text,
  UNIQUE (material_code, version)
);

-- 3. Enable RLS on material_factors
ALTER TABLE public.material_factors ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for material_factors
CREATE POLICY "Authenticated can read factors"
  ON public.material_factors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read factors"
  ON public.material_factors FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can manage factors"
  ON public.material_factors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Populate material_factors v1 from current catalog data
INSERT INTO public.material_factors (material_code, factor_co2, factor_energia, factor_agua, factor_arboles, version, fecha_inicio, activo, fuente)
SELECT 
  code,
  factor_co2,
  factor_energia,
  factor_agua,
  factor_arboles,
  1,
  now(),
  true,
  factors_source
FROM public.material_catalog
WHERE is_active = true
ON CONFLICT (material_code, version) DO NOTHING;

-- 6. Add factor_version to material_captures for traceability
ALTER TABLE public.material_captures
  ADD COLUMN IF NOT EXISTS factor_version integer;

-- 7. Audit trigger for factor changes
CREATE OR REPLACE FUNCTION public.fn_audit_factor_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _role text;
BEGIN
  _user_id := auth.uid();
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, new_value, user_id, user_role, comment)
    VALUES ('material_factors', NEW.id::text, 'FACTOR_VERSION_CREATED', 'version',
            NEW.version::text, _user_id, _role, 
            'material_code=' || NEW.material_code || ' v' || NEW.version);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.activo IS DISTINCT FROM NEW.activo THEN
      INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
      VALUES ('material_factors', NEW.id::text, 'FACTOR_STATUS_CHANGE', 'activo',
              OLD.activo::text, NEW.activo::text, _user_id, _role);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_factor_change
  AFTER INSERT OR UPDATE ON public.material_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_factor_change();
