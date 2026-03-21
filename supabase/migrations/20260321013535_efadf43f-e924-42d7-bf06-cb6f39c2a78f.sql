
CREATE TABLE public.public_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  cliente text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  notas text
);

ALTER TABLE public.public_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read tokens" ON public.public_tokens
  FOR SELECT TO anon USING (true);
