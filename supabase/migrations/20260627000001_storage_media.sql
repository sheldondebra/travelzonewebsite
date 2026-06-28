-- Supabase Storage bucket for admin media uploads

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create policy "Public can view media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Staff can upload media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and public.is_staff()
  );

create policy "Staff can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_staff());

create policy "Admins can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.staff_role() = 'admin');
