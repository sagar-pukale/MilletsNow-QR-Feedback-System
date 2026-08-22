ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_accuracy double precision,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS operating_system text,
  ADD COLUMN IF NOT EXISTS browser text;
