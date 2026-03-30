
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admin can read all tokens" ON public.public_tokens;
DROP POLICY IF EXISTS "Admin can insert tokens" ON public.public_tokens;
DROP POLICY IF EXISTS "Admin can update tokens" ON public.public_tokens;

-- Recreate with admin + administrador + direccion
CREATE POLICY "Admin/Administrador/Direccion can read tokens"
  ON public.public_tokens FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'administrador'::app_role)
    OR has_role(auth.uid(), 'direccion'::app_role)
  );

CREATE POLICY "Admin/Administrador/Direccion can insert tokens"
  ON public.public_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'administrador'::app_role)
    OR has_role(auth.uid(), 'direccion'::app_role)
  );

CREATE POLICY "Admin/Administrador/Direccion can update tokens"
  ON public.public_tokens FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'administrador'::app_role)
    OR has_role(auth.uid(), 'direccion'::app_role)
  );
