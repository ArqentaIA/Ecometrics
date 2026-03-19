CREATE POLICY "Anon can read confirmed captures"
ON public.material_captures
FOR SELECT
TO anon
USING (is_confirmed = true);