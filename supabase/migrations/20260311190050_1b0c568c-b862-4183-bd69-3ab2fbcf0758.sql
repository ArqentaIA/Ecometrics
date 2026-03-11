-- Allow direccion role to read all material_captures (same as admin)
CREATE POLICY "Direccion can view all captures"
ON public.material_captures
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'direccion'::app_role));