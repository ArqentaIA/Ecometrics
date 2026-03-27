-- Disable audit triggers before schema changes
ALTER TABLE public.material_captures DISABLE TRIGGER USER;

-- Add traceability columns
ALTER TABLE public.material_captures
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'capturado',
  ADD COLUMN IF NOT EXISTS impacto_pendiente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS capture_role text;

-- Auto-folio function
CREATE OR REPLACE FUNCTION public.fn_generate_capture_folio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := 'CAP-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-folio trigger
DROP TRIGGER IF EXISTS trg_generate_capture_folio ON public.material_captures;
CREATE TRIGGER trg_generate_capture_folio
  BEFORE INSERT ON public.material_captures
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_generate_capture_folio();

-- Enhanced audit trigger for status/kg changes
CREATE OR REPLACE FUNCTION public.fn_audit_capture_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role)
    VALUES ('material_captures', NEW.id::text, 'STATUS_CHANGE', 'status',
            OLD.status, NEW.status, _user_id, _role);
  END IF;

  IF OLD.kg_brutos IS DISTINCT FROM NEW.kg_brutos THEN
    INSERT INTO public.audit_log (table_name, record_id, event_type, field_changed, old_value, new_value, user_id, user_role, comment)
    VALUES ('material_captures', NEW.id::text, 'CORRECTION', 'kg_brutos',
            OLD.kg_brutos::text, NEW.kg_brutos::text, _user_id, _role, 'Corrección de peso');
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing records
UPDATE public.material_captures
SET folio = 'CAP-' || to_char(created_at, 'YYYYMMDD-HH24MISS') || '-' || substr(id::text, 1, 4)
WHERE folio IS NULL;

UPDATE public.material_captures
SET status = 'validado'
WHERE status = 'capturado' AND is_confirmed = true;

UPDATE public.material_captures
SET impacto_pendiente = true
WHERE result_co2 = 0 AND result_energia = 0 AND result_agua = 0 AND result_arboles = 0
  AND kg_brutos > 0;

-- Re-enable triggers
ALTER TABLE public.material_captures ENABLE TRIGGER USER;