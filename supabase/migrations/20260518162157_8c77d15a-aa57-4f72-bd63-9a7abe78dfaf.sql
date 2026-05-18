
-- Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text UNIQUE,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Business entity type + identification
DO $$ BEGIN
  CREATE TYPE public.entity_type AS ENUM ('pf', 'pj');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS entity_type public.entity_type NOT NULL DEFAULT 'pf',
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS migration_status text,
  ADD COLUMN IF NOT EXISTS migration_cnpj text,
  ADD COLUMN IF NOT EXISTS migration_legal_name text,
  ADD COLUMN IF NOT EXISTS migration_requested_at timestamptz;

-- Storage bucket for selfies (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-selfies', 'user-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Selfie policies: user uploads/reads own; admin reads all
CREATE POLICY "users upload own selfie"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users read own selfie"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-selfies' AND (auth.uid()::text = (storage.foldername(name))[1] OR app_private.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "users update own selfie"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
