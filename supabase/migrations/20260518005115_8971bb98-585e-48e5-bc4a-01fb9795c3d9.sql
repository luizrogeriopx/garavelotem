
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('business-assets', 'business-assets', true) on conflict (id) do nothing;

-- Public read
create policy "public read banners"
on storage.objects for select
using (bucket_id = 'banners');

create policy "public read business-assets"
on storage.objects for select
using (bucket_id = 'business-assets');

-- Banners: admin only write
create policy "admin insert banners"
on storage.objects for insert
with check (bucket_id = 'banners' and app_private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "admin update banners"
on storage.objects for update
using (bucket_id = 'banners' and app_private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "admin delete banners"
on storage.objects for delete
using (bucket_id = 'banners' and app_private.has_role(auth.uid(), 'admin'::public.app_role));

-- business-assets: authenticated users manage own folder (auth.uid()/...)
create policy "user insert business-assets"
on storage.objects for insert
with check (
  bucket_id = 'business-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user update business-assets"
on storage.objects for update
using (
  bucket_id = 'business-assets'
  and (auth.uid()::text = (storage.foldername(name))[1] or app_private.has_role(auth.uid(), 'admin'::public.app_role))
);

create policy "user delete business-assets"
on storage.objects for delete
using (
  bucket_id = 'business-assets'
  and (auth.uid()::text = (storage.foldername(name))[1] or app_private.has_role(auth.uid(), 'admin'::public.app_role))
);
