
-- Fix audit_log INSERT policy to restrict to user's own ID
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;
CREATE POLICY "Users can insert own audit entries"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- AUDIT TRIGGER FUNCTION (SECURITY DEFINER)
-- Automatically logs changes to sensitive tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _role text;
  _record_id text;
  _event text;
BEGIN
  _user_id := auth.uid();
  
  -- Get user role
  SELECT role::text INTO _role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _event := 'DELETE';
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _event := 'INSERT';
  ELSE
    _record_id := NEW.id::text;
    _event := 'UPDATE';
  END IF;

  INSERT INTO public.audit_log (
    table_name, record_id, event_type, user_id, user_role
  ) VALUES (
    TG_TABLE_NAME, _record_id, _event, _user_id, _role
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Attach audit triggers to sensitive tables ───
CREATE TRIGGER trg_audit_material_catalog
  AFTER INSERT OR UPDATE OR DELETE ON public.material_catalog
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_material_captures
  AFTER INSERT OR UPDATE OR DELETE ON public.material_captures
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_additional_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.additional_material_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_temporary_materials
  AFTER INSERT OR UPDATE OR DELETE ON public.temporary_materials
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_system_parameters
  AFTER INSERT OR UPDATE OR DELETE ON public.system_parameters
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- ─── Specific audit function for price changes with old/new values ───
CREATE OR REPLACE FUNCTION public.fn_audit_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _role text;
BEGIN
  _user_id := auth.uid();
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;

  IF OLD.default_cost_per_kg IS DISTINCT FROM NEW.default_cost_per_kg THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'PRICE_CHANGE', 'default_cost_per_kg',
            OLD.default_cost_per_kg::text, NEW.default_cost_per_kg::text, _user_id, _role);
  END IF;

  -- Track factor changes
  IF OLD.factor_co2 IS DISTINCT FROM NEW.factor_co2 THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'FACTOR_CHANGE', 'factor_co2',
            OLD.factor_co2::text, NEW.factor_co2::text, _user_id, _role);
  END IF;
  IF OLD.factor_energia IS DISTINCT FROM NEW.factor_energia THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'FACTOR_CHANGE', 'factor_energia',
            OLD.factor_energia::text, NEW.factor_energia::text, _user_id, _role);
  END IF;
  IF OLD.factor_agua IS DISTINCT FROM NEW.factor_agua THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'FACTOR_CHANGE', 'factor_agua',
            OLD.factor_agua::text, NEW.factor_agua::text, _user_id, _role);
  END IF;
  IF OLD.factor_arboles IS DISTINCT FROM NEW.factor_arboles THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'FACTOR_CHANGE', 'factor_arboles',
            OLD.factor_arboles::text, NEW.factor_arboles::text, _user_id, _role);
  END IF;
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_catalog', NEW.id::text, 'STATUS_CHANGE', 'is_active',
            OLD.is_active::text, NEW.is_active::text, _user_id, _role);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_catalog_details
  AFTER UPDATE ON public.material_catalog
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_price_change();

-- ─── Audit capture confirmation/reopen ───
CREATE OR REPLACE FUNCTION public.fn_audit_capture_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _role text;
BEGIN
  _user_id := auth.uid();
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;

  IF OLD.is_confirmed IS DISTINCT FROM NEW.is_confirmed THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_captures', NEW.id::text,
            CASE WHEN NEW.is_confirmed THEN 'CAPTURE_CONFIRMED' ELSE 'CAPTURE_REOPENED' END,
            'is_confirmed', OLD.is_confirmed::text, NEW.is_confirmed::text, _user_id, _role);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_capture_confirm
  AFTER UPDATE ON public.material_captures
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_capture_confirm();

-- ─── Migrate existing roles: 'user' -> 'operador', 'admin' stays as-is ───
UPDATE public.user_roles SET role = 'operador' WHERE role = 'user';
