
-- 1. Add pin column to public_tokens
ALTER TABLE public.public_tokens ADD COLUMN IF NOT EXISTS pin text NOT NULL DEFAULT '';

-- 2. Create RPC to get public material catalog (no pricing data)
CREATE OR REPLACE FUNCTION public.get_public_material_catalog()
RETURNS TABLE(
  code text,
  name text,
  family text,
  default_yield numeric,
  yield_min numeric,
  yield_max numeric,
  yield_loss_reason text,
  factor_arboles numeric,
  factor_co2 numeric,
  factor_energia numeric,
  factor_agua numeric,
  uses_arboles boolean,
  uses_co2 boolean,
  uses_energia boolean,
  uses_agua boolean,
  is_active boolean,
  display_order integer,
  yield_source text,
  factors_source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    mc.code, mc.name, mc.family, mc.default_yield,
    mc.yield_min, mc.yield_max, mc.yield_loss_reason,
    mc.factor_arboles, mc.factor_co2, mc.factor_energia, mc.factor_agua,
    mc.uses_arboles, mc.uses_co2, mc.uses_energia, mc.uses_agua,
    mc.is_active, mc.display_order, mc.yield_source, mc.factors_source
  FROM public.material_catalog mc
  WHERE mc.is_active = true
  ORDER BY mc.display_order
$$;

-- 3. Create RPC to validate token + pin together
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
  )
$$;
