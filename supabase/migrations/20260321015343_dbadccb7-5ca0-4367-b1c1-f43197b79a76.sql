-- FIX 1: Remove direct anon access to material_captures
DROP POLICY IF EXISTS "Anon can read confirmed captures" ON public.material_captures;

-- Create aggregated view for public/anon (no user_id, no individual records)
CREATE OR REPLACE VIEW public.confirmed_captures_summary AS
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

-- FIX 2: Prevent privilege escalation on user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));