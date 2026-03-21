-- Fix security definer view issue
DROP VIEW IF EXISTS public.confirmed_captures_summary;

CREATE VIEW public.confirmed_captures_summary
WITH (security_invoker = true) AS
SELECT
  material_code,
  month,
  year,
  SUM(kg_brutos)::numeric AS kg_brutos,
  SUM(kg_netos)::numeric AS kg_netos,
  SUM(result_arboles)::numeric AS result_arboles,
  SUM(result_co2)::numeric AS result_co2,
  SUM(result_energia)::numeric AS result_energia,
  SUM(result_agua)::numeric AS result_agua,
  SUM(result_economic_impact)::numeric AS result_economic_impact,
  AVG(cost_per_kg_applied)::numeric AS cost_per_kg_applied
FROM public.material_captures
WHERE is_confirmed = true
GROUP BY material_code, month, year;

GRANT SELECT ON public.confirmed_captures_summary TO anon;

-- Since the view is now security_invoker, anon needs to read from material_captures
-- But we DON'T want anon reading individual rows. We need a security_definer function instead.
-- Let's drop this approach and use an RPC function instead.