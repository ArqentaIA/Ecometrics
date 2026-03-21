
-- Allow admin to read all tokens
CREATE POLICY "Admin can read all tokens" ON public.public_tokens
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to insert tokens
CREATE POLICY "Admin can insert tokens" ON public.public_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to update tokens
CREATE POLICY "Admin can update tokens" ON public.public_tokens
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
