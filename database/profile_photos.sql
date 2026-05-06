alter table public.profiles
  add column if not exists profile_photo_url text;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
  on storage.objects
  for select
  using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_authenticated_insert_own_folder" on storage.objects;
create policy "profile_photos_authenticated_insert_own_folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_authenticated_update_own_folder" on storage.objects;
create policy "profile_photos_authenticated_update_own_folder"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_authenticated_delete_own_folder" on storage.objects;
create policy "profile_photos_authenticated_delete_own_folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
