DO $$
BEGIN
  CREATE TYPE public.feedback_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS tracking_priority public.feedback_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_action_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
