
-- Schedule daily check at 6am UTC to deactivate expired tokens
SELECT cron.schedule(
  'check-token-expiry',
  '0 6 * * *',
  'SELECT public.check_token_expiry()'
);
