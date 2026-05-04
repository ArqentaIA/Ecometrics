-- 1) Token-gated summary: new signature with _token
CREATE OR REPLACE FUNCTION public.get_confirmed_captures_summary(_year integer, _token text)
RETURNS TABLE(
  material_code text, month integer,
  kg_brutos numeric, kg_netos numeric,
  result_arboles numeric, result_co2 numeric,
  result_energia numeric, result_agua numeric,
  result_economic_impact numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    mc.material_code,
    mc.month,
    SUM(mc.kg_brutos)::numeric,
    SUM(mc.kg_netos)::numeric,
    SUM(mc.result_arboles)::numeric,
    SUM(mc.result_co2)::numeric,
    SUM(mc.result_energia)::numeric,
    SUM(mc.result_agua)::numeric,
    SUM(mc.result_economic_impact)::numeric
  FROM public.material_captures mc
  WHERE mc.is_confirmed = true
    AND mc.year = _year
    AND EXISTS (
      SELECT 1 FROM public.public_tokens pt
      WHERE pt.token = _token
        AND pt.activo = true
        AND (pt.fecha_vencimiento IS NULL OR pt.fecha_vencimiento > CURRENT_DATE)
    )
  GROUP BY mc.material_code, mc.month
$$;

-- 2) Drop the legacy unguarded summary so it cannot be called without a token
DROP FUNCTION IF EXISTS public.get_confirmed_captures_summary(integer);

-- 3) Token-gate the public material catalog as well
CREATE OR REPLACE FUNCTION public.get_public_material_catalog(_token text)
RETURNS TABLE(
  code text, name text, family text, default_yield numeric,
  yield_min numeric, yield_max numeric, yield_loss_reason text,
  factor_arboles numeric, factor_co2 numeric, factor_energia numeric, factor_agua numeric,
  uses_arboles boolean, uses_co2 boolean, uses_energia boolean, uses_agua boolean,
  is_active boolean, display_order integer, yield_source text, factors_source text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    mc.code, mc.name, mc.family, mc.default_yield,
    mc.yield_min, mc.yield_max, mc.yield_loss_reason,
    mc.factor_arboles, mc.factor_co2, mc.factor_energia, mc.factor_agua,
    mc.uses_arboles, mc.uses_co2, mc.uses_energia, mc.uses_agua,
    mc.is_active, mc.display_order, mc.yield_source, mc.factors_source
  FROM public.material_catalog mc
  WHERE mc.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.public_tokens pt
      WHERE pt.token = _token
        AND pt.activo = true
        AND (pt.fecha_vencimiento IS NULL OR pt.fecha_vencimiento > CURRENT_DATE)
    )
  ORDER BY mc.display_order
$$;

-- Drop the legacy unguarded catalog RPC
DROP FUNCTION IF EXISTS public.get_public_material_catalog();

-- 4) Remove anonymous direct SELECT on material_catalog (pricing/factor exposure)
DROP POLICY IF EXISTS "Anon can read material catalog" ON public.material_catalog;

-- 5) Remove anonymous direct SELECT on material_factors as well (same family of leak)
DROP POLICY IF EXISTS "Anon can read factors" ON public.material_factors;