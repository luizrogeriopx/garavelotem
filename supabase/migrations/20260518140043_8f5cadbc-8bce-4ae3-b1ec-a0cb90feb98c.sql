-- Allow business owners (and admins) to upload promotion images under promotions/{businessId}/...
CREATE POLICY "owner insert promotion assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] = 'promotions'
  AND (
    app_private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "owner update promotion assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] = 'promotions'
  AND (
    app_private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "owner delete promotion assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] = 'promotions'
  AND (
    app_private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.owner_id = auth.uid()
    )
  )
);