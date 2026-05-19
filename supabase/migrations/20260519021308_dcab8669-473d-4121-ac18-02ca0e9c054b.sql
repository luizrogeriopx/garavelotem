
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS blocked_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_until timestamptz;

-- Replace public read policy for businesses to also hide blocked ones
DROP POLICY IF EXISTS "approved businesses public read" ON public.businesses;
CREATE POLICY "approved businesses public read"
ON public.businesses
FOR SELECT
USING (
  (status = 'approved'::business_status AND (blocked_until IS NULL OR blocked_until < now()))
  OR auth.uid() = owner_id
  OR app_private.has_role(auth.uid(), 'admin'::app_role)
);
