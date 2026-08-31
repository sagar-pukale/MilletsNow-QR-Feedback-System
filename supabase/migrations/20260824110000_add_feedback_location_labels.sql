ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS location_locality text,
  ADD COLUMN IF NOT EXISTS location_district text,
  ADD COLUMN IF NOT EXISTS location_state text;
