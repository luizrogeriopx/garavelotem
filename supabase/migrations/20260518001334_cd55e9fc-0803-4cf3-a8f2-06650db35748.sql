CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA app_private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(UUID, public.app_role) TO anon, authenticated;

DROP POLICY IF EXISTS "roles viewable by self or admin" ON public.user_roles;
DROP POLICY IF EXISTS "admin manages roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin manages categories" ON public.categories;
DROP POLICY IF EXISTS "admin manages plans" ON public.plans;
DROP POLICY IF EXISTS "approved businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "owner updates own business" ON public.businesses;
DROP POLICY IF EXISTS "admin deletes business" ON public.businesses;
DROP POLICY IF EXISTS "active promotions public read" ON public.promotions;
DROP POLICY IF EXISTS "owner manages promotions" ON public.promotions;
DROP POLICY IF EXISTS "active banners public read" ON public.banners;
DROP POLICY IF EXISTS "admin manages banners" ON public.banners;
DROP POLICY IF EXISTS "users delete own review" ON public.reviews;

CREATE POLICY "roles viewable by self or admin"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages roles"
ON public.user_roles
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages categories"
ON public.categories
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages plans"
ON public.plans
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "approved businesses public read"
ON public.businesses
FOR SELECT
USING (status = 'approved' OR auth.uid() = owner_id OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "owner updates own business"
ON public.businesses
FOR UPDATE
USING (auth.uid() = owner_id OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin deletes business"
ON public.businesses
FOR DELETE
USING (app_private.has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);

CREATE POLICY "active promotions public read"
ON public.promotions
FOR SELECT
USING (
  is_active = true
  OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR app_private.has_role(auth.uid(), 'admin')
);

CREATE POLICY "owner manages promotions"
ON public.promotions
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR app_private.has_role(auth.uid(), 'admin')
);

CREATE POLICY "active banners public read"
ON public.banners
FOR SELECT
USING (is_active = true OR app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages banners"
ON public.banners
FOR ALL
USING (app_private.has_role(auth.uid(), 'admin'));

CREATE POLICY "users delete own review"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;