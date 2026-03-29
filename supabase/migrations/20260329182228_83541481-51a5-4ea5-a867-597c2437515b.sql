ALTER TABLE public.material_captures DROP CONSTRAINT material_captures_user_id_material_code_month_year_key;

CREATE INDEX IF NOT EXISTS idx_captures_user_material_period
ON public.material_captures (user_id, material_code, year, month);