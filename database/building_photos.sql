alter table public.buildings_new
  add column if not exists building_photo_url text;

insert into storage.buckets (id, name, public)
values ('building-photos', 'building-photos', true)
on conflict (id) do nothing;

drop policy if exists "building_photos_public_read" on storage.objects;
create policy "building_photos_public_read"
  on storage.objects
  for select
  using (bucket_id = 'building-photos');

drop policy if exists "building_photos_managers_insert" on storage.objects;
create policy "building_photos_managers_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'building-photos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.building_users bu
      where bu.building_id::text = (storage.foldername(name))[1]
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  );

drop policy if exists "building_photos_managers_update" on storage.objects;
create policy "building_photos_managers_update"
  on storage.objects
  for update
  using (
    bucket_id = 'building-photos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.building_users bu
      where bu.building_id::text = (storage.foldername(name))[1]
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  )
  with check (
    bucket_id = 'building-photos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.building_users bu
      where bu.building_id::text = (storage.foldername(name))[1]
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  );

drop policy if exists "building_photos_managers_delete" on storage.objects;
create policy "building_photos_managers_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'building-photos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.building_users bu
      where bu.building_id::text = (storage.foldername(name))[1]
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  );

