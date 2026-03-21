
-- Enable pg_cron and pg_net for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the token that has "Diciembre 2026" in notas
UPDATE public.public_tokens SET fecha_vencimiento = '2026-12-31' WHERE notas ILIKE '%diciembre 2026%' AND fecha_vencimiento IS NULL;
