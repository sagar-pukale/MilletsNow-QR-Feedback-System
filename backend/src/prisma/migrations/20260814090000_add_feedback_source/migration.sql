ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'product_qr';

UPDATE public.feedback
SET source = 'product_qr'
WHERE source IS NULL OR btrim(source) = '';

CREATE INDEX IF NOT EXISTS feedback_source_idx ON public.feedback(source);
