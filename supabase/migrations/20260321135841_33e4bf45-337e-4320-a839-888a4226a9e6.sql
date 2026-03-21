
-- 1. Add fecha_vencimiento column
ALTER TABLE public.public_tokens ADD COLUMN IF NOT EXISTS fecha_vencimiento date;

-- 2. Migrate existing notas to fecha_vencimiento where possible
UPDATE public.public_tokens SET fecha_vencimiento = '2027-03-31' WHERE notas ILIKE '%marzo 2027%';
UPDATE public.public_tokens SET fecha_vencimiento = '2027-12-31' WHERE notas ILIKE '%dic%2027%' OR notas ILIKE '%diciembre 2027%';

-- 3. Update validate_public_token to also check expiry
CREATE OR REPLACE FUNCTION public.validate_public_token(_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_tokens
    WHERE token = _token AND activo = true
      AND (fecha_vencimiento IS NULL OR fecha_vencimiento > CURRENT_DATE)
  )
$$;

-- 4. Update validate_public_token_with_pin to also check expiry
CREATE OR REPLACE FUNCTION public.validate_public_token_with_pin(_token text, _pin text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_tokens
    WHERE token = _token AND pin = _pin AND activo = true
      AND (fecha_vencimiento IS NULL OR fecha_vencimiento > CURRENT_DATE)
  )
$$;

-- 5. Create RPC to check and deactivate expired tokens
CREATE OR REPLACE FUNCTION public.check_token_expiry()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.public_tokens
  SET activo = false
  WHERE activo = true
    AND fecha_vencimiento IS NOT NULL
    AND fecha_vencimiento <= CURRENT_DATE;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
