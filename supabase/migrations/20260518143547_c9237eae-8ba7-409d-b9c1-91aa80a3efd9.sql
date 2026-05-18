CREATE POLICY "admins upload business-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-assets' AND app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update business-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'business-assets' AND app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete business-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'business-assets' AND app_private.has_role(auth.uid(), 'admin'::app_role));