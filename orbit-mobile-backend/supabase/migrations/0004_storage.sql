-- 0004_storage.sql : product image bucket + policies. Run FOURTH.
-- Public READ (images are shown to everyone); only admins may upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "product images are public"  on storage.objects for select using (bucket_id = 'product-images');
create policy "admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins replace product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
