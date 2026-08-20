CREATE TABLE IF NOT EXISTS public.qr_sticker_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  qr_token text NOT NULL,
  qr_destination_url text NOT NULL,
  label_template text NOT NULL,
  text_mode text NOT NULL,
  text_size integer NOT NULL,
  qr_size integer NOT NULL,
  sticker_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qr_sticker_templates_product_id_idx
  ON public.qr_sticker_templates(product_id);

CREATE INDEX IF NOT EXISTS qr_sticker_templates_qr_code_id_idx
  ON public.qr_sticker_templates(qr_code_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'qr_sticker_templates_updated_at'
  ) THEN
    CREATE TRIGGER qr_sticker_templates_updated_at
      BEFORE UPDATE ON public.qr_sticker_templates
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
