
CREATE TYPE public.change_request_target AS ENUM ('profile', 'business');
CREATE TYPE public.change_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type public.change_request_target NOT NULL,
  business_id uuid NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NULL,
  status public.change_request_status NOT NULL DEFAULT 'pending',
  admin_note text NULL,
  reviewed_by uuid NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users create own change request"
  ON public.change_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own or admin views all"
  ON public.change_requests FOR SELECT
  USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin updates change request"
  ON public.change_requests FOR UPDATE
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin deletes change request"
  ON public.change_requests FOR DELETE
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_change_requests_user ON public.change_requests(user_id);
CREATE INDEX idx_change_requests_status ON public.change_requests(status);

CREATE TRIGGER change_requests_updated_at
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
