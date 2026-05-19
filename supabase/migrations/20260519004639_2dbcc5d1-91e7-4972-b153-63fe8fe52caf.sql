
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.claim_entity_type AS ENUM ('pf', 'pj');

CREATE TABLE public.business_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  entity_type public.claim_entity_type NOT NULL,
  full_name text NOT NULL,
  legal_name text,
  cpf text,
  cnpj text,
  phone text NOT NULL,
  whatsapp text,
  email text NOT NULL,
  message text,
  status public.claim_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_claims_business ON public.business_claims(business_id);
CREATE INDEX idx_business_claims_user ON public.business_claims(user_id);
CREATE INDEX idx_business_claims_status ON public.business_claims(status);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users create own claim"
ON public.business_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own claim"
ON public.business_claims FOR SELECT
USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin updates claim"
ON public.business_claims FOR UPDATE
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin deletes claim"
ON public.business_claims FOR DELETE
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_claims_updated_at
BEFORE UPDATE ON public.business_claims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
