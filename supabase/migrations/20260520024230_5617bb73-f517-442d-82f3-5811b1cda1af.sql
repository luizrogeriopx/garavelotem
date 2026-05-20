DROP POLICY IF EXISTS "admin writes app-assets" ON storage.objects;
DROP POLICY IF EXISTS "admin updates app-assets" ON storage.objects;
DROP POLICY IF EXISTS "admin deletes app-assets" ON storage.objects;

CREATE POLICY "admin writes app-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'app-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin updates app-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'app-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin deletes app-assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'app-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);