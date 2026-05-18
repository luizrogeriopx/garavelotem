-- Allow admins to update any profile
CREATE POLICY "admins update any profile"
ON public.profiles
FOR UPDATE
USING (app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));