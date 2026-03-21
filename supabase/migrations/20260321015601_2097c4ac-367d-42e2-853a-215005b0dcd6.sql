-- Drop the view approach entirely
DROP VIEW IF EXISTS public.confirmed_captures_summary;

-- Create a security definer function that returns aggregated data only
CREATE OR REPLACE FUNCTION public.get_confirmed_captures_summary(_year integer)
RETURNS TABLE (
  material_code text,
  month integer,
  kg_brutos numeric,
  kg_netos numeric,
  result_arboles numeric,
  result_co2 numeric,
  result_energia numeric,
  result_agua numeric,
  result_economic_impact numeric,
  cost_per_kg_applied numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    SUM(mc.result_economic_impact)::numeric,
    AVG(mc.cost_per_kg_applied)::numeric
  FROM public.material_captures mc
  WHERE mc.is_confirmed = true AND mc.year = _year
  GROUP BY mc.material_code, mc.month
$$;