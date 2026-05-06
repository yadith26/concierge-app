create table if not exists public.building_units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings_new(id) on delete cascade,
  unit_key text not null,
  unit_label text not null,
  unit_kind text not null default 'apartment',
  status text not null default 'available',
  floor text,
  bedrooms text,
  bathrooms numeric(4, 1),
  size_sqft integer,
  tenant_name text,
  tenant_phone text,
  tenant_email text,
  lease_start date,
  lease_end date,
  available_since date,
  garage_label text,
  storage_label text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint building_units_kind_check
    check (unit_kind = any (array[
      'apartment'::text,
      'common_area'::text,
      'garage'::text,
      'storage'::text
    ])),
  constraint building_units_status_check
    check (status = any (array[
      'occupied'::text,
      'available'::text,
      'expiring_soon'::text,
      'problematic'::text,
      'inactive'::text
    ])),
  constraint building_units_lease_dates_check
    check (
      lease_start is null
      or lease_end is null
      or lease_end >= lease_start
    )
);

create unique index if not exists building_units_building_key_unique
  on public.building_units (building_id, unit_key);

create index if not exists building_units_building_kind_idx
  on public.building_units (building_id, unit_kind);

create index if not exists building_units_building_status_idx
  on public.building_units (building_id, status);

create index if not exists building_units_lease_end_idx
  on public.building_units (building_id, lease_end)
  where lease_end is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists building_units_set_updated_at on public.building_units;
create trigger building_units_set_updated_at
before update on public.building_units
for each row
execute function public.set_updated_at();

alter table public.building_units enable row level security;

drop policy if exists "building_units_select_building_members" on public.building_units;
create policy "building_units_select_building_members"
  on public.building_units
  for select
  using (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = building_units.building_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  );

drop policy if exists "building_units_insert_managers" on public.building_units;
create policy "building_units_insert_managers"
  on public.building_units
  for insert
  with check (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = building_units.building_id
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "building_units_update_managers" on public.building_units;
create policy "building_units_update_managers"
  on public.building_units
  for update
  using (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = building_units.building_id
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  )
  with check (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = building_units.building_id
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  );

drop policy if exists "building_units_delete_managers" on public.building_units;
create policy "building_units_delete_managers"
  on public.building_units
  for delete
  using (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = building_units.building_id
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  );

