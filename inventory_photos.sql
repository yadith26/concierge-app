create table if not exists public.inventory_item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  image_url text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists inventory_item_photos_item_idx
  on public.inventory_item_photos (item_id, created_at desc);

alter table public.inventory_item_photos enable row level security;

drop policy if exists "inventory_item_photos_select_building_members" on public.inventory_item_photos;
create policy "inventory_item_photos_select_building_members"
  on public.inventory_item_photos
  for select
  using (
    exists (
      select 1
      from public.inventory_items ii
      join public.building_users bu on bu.building_id = ii.building_id
      where ii.id = inventory_item_photos.item_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  );

drop policy if exists "inventory_item_photos_insert_building_members" on public.inventory_item_photos;
create policy "inventory_item_photos_insert_building_members"
  on public.inventory_item_photos
  for insert
  with check (
    exists (
      select 1
      from public.inventory_items ii
      join public.building_users bu on bu.building_id = ii.building_id
      where ii.id = inventory_item_photos.item_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
    and (uploaded_by is null or uploaded_by = auth.uid())
  );

drop policy if exists "inventory_item_photos_delete_building_members" on public.inventory_item_photos;
create policy "inventory_item_photos_delete_building_members"
  on public.inventory_item_photos
  for delete
  using (
    exists (
      select 1
      from public.inventory_items ii
      join public.building_users bu on bu.building_id = ii.building_id
      where ii.id = inventory_item_photos.item_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  );

insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', true)
on conflict (id) do nothing;

drop policy if exists "inventory_photos_public_read" on storage.objects;
create policy "inventory_photos_public_read"
  on storage.objects
  for select
  using (bucket_id = 'inventory-photos');

drop policy if exists "inventory_photos_authenticated_insert" on storage.objects;
create policy "inventory_photos_authenticated_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'inventory-photos'
    and auth.uid() is not null
  );

drop policy if exists "inventory_photos_authenticated_delete" on storage.objects;
create policy "inventory_photos_authenticated_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'inventory-photos'
    and auth.uid() is not null
  );
