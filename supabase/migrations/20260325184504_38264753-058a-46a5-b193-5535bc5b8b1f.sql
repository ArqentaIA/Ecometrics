ALTER TABLE public.material_captures 
ADD COLUMN IF NOT EXISTS proveedor text DEFAULT NULL;