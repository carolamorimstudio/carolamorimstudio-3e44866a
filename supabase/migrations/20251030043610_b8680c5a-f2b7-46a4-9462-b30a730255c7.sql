-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to cleanup past appointments every hour
-- This will run at minute 0 of every hour (e.g., 1:00, 2:00, 3:00, etc.)
SELECT cron.schedule(
  'cleanup-past-appointments-hourly',
  '0 * * * *', -- At minute 0 of every hour
  $$
  SELECT
    net.http_post(
        url:='https://gsvaitbqkmrsdswzfrmh.supabase.co/functions/v1/cleanup-past-appointments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdmFpdGJxa21yc2Rzd3pmcm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Nzg3OTAsImV4cCI6MjA3NzM1NDc5MH0.npatmuA3gPK_VMNNaeetkEt30hpVtb8bUuoH1FdjtKo"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- To view all scheduled jobs, run:
-- SELECT * FROM cron.job;

-- To unschedule this job if needed, run:
-- SELECT cron.unschedule('cleanup-past-appointments-hourly');