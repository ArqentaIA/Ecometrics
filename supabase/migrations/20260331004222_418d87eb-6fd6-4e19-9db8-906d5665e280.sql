-- Disable user-defined triggers on material_captures
ALTER TABLE public.material_captures DISABLE TRIGGER USER;

DELETE FROM public.material_captures WHERE year = 2026 AND month = 3;

-- Re-enable user-defined triggers
ALTER TABLE public.material_captures ENABLE TRIGGER USER;