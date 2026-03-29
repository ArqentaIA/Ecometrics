
ALTER TABLE public.material_captures DISABLE TRIGGER USER;
DELETE FROM public.material_captures WHERE material_code = 'bolsa plastico';
ALTER TABLE public.material_captures ENABLE TRIGGER USER;
