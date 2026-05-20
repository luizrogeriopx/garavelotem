INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public reads app-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

CREATE POLICY "admin writes app-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin updates app-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin deletes app-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));