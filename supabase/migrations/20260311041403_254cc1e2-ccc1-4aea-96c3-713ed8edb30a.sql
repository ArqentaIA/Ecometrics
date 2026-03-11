
-- Add default_cost_per_kg to material_catalog
ALTER TABLE public.material_catalog
  ADD COLUMN IF NOT EXISTS default_cost_per_kg numeric DEFAULT 0;

-- Add cost_per_kg_applied and result_economic_impact to material_captures
ALTER TABLE public.material_captures
  ADD COLUMN IF NOT EXISTS cost_per_kg_applied numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_economic_impact numeric DEFAULT 0;
