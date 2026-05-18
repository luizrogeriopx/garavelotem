CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TYPE public.institution_kind AS ENUM ('posto_saude', 'cartorio', 'delegacia', 'conselho_tutelar', 'hospital', 'escola', 'bombeiros', 'prefeitura', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.public_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind public.institution_kind NOT NULL DEFAULT 'outros',
  description text,
  address text,
  neighborhood text,
  city text DEFAULT 'Aparecida de Goiânia',
  state text DEFAULT 'GO',
  phone text,
  whatsapp text,
  email text,
  image_url text,
  hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  lat numeric,
  lng numeric,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active institutions public read" ON public.public_institutions;
CREATE POLICY "active institutions public read"
ON public.public_institutions FOR SELECT
USING (is_active = true OR app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admin manages institutions" ON public.public_institutions;
CREATE POLICY "admin manages institutions"
ON public.public_institutions FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_public_institutions_updated_at ON public.public_institutions;
CREATE TRIGGER update_public_institutions_updated_at
BEFORE UPDATE ON public.public_institutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();