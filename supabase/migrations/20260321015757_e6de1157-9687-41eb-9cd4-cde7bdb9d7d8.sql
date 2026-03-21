-- Remove anon full read access to public_tokens
DROP POLICY IF EXISTS "Anon can read tokens" ON public.public_tokens;

-- Create a security definer function to validate a single token
CREATE OR REPLACE FUNCTION public.validate_public_token(_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_tokens
    WHERE token = _token AND activo = true
  )
$$;