create table if not exists public.unit_history (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings_new(id) on delete cascade,
  unit_key text not null,
  unit_label text not null,
  event_type text not null,
  event_category text not null,
  title text not null,
  description text,
  happened_at date not null,
  source_table text not null,
  source_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists unit_history_source_unique
  on public.unit_history (source_table, source_id, unit_key, event_type);

create index if not exists unit_history_building_unit_idx
  on public.unit_history (building_id, unit_key, happened_at desc);

alter table public.unit_history enable row level security;

drop policy if exists "unit_history_select_building_members" on public.unit_history;
create policy "unit_history_select_building_members"
  on public.unit_history
  for select
  using (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = unit_history.building_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  );

drop policy if exists "unit_history_insert_building_members" on public.unit_history;
create policy "unit_history_insert_building_members"
  on public.unit_history
  for insert
  with check (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = unit_history.building_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "unit_history_update_building_members" on public.unit_history;
create policy "unit_history_update_building_members"
  on public.unit_history
  for update
  using (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = unit_history.building_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  )
  with check (
    exists (
      select 1
      from public.building_users bu
      where bu.building_id = unit_history.building_id
        and bu.user_id = auth.uid()
        and bu.role = any (array['concierge'::text, 'manager'::text])
    )
  );
