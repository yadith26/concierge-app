create table if not exists public.manager_tasks (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references public.buildings_new(id) on delete set null,
  manager_id uuid not null references public.profiles(id) on delete cascade,
  concierge_id uuid references public.profiles(id) on delete set null,
  source_message_id uuid references public.building_messages(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'other',
  priority text not null default 'medium',
  status text not null default 'pending',
  task_date date not null,
  task_time time,
  apartment_or_area text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manager_tasks_category_check
    check (category = any (array[
      'call'::text,
      'email'::text,
      'follow_up'::text,
      'document'::text,
      'payment'::text,
      'meeting'::text,
      'vendor'::text,
      'reminder'::text,
      'other'::text
    ])),
  constraint manager_tasks_priority_check
    check (priority = any (array['high'::text, 'medium'::text, 'low'::text])),
  constraint manager_tasks_status_check
    check (status = any (array['pending'::text, 'in_progress'::text, 'completed'::text]))
);

alter table public.manager_tasks
  alter column building_id drop not null;

alter table public.manager_tasks
  add column if not exists concierge_id uuid references public.profiles(id) on delete set null;

alter table public.manager_tasks
  drop constraint if exists manager_tasks_category_check;

update public.manager_tasks
set category = case
  when category in ('visit') then 'meeting'
  when category in ('delivery', 'change', 'repair', 'paint', 'pest', 'inspection') then 'follow_up'
  when category in ('cleaning') then 'vendor'
  when category in ('call', 'email', 'follow_up', 'document', 'payment', 'meeting', 'vendor', 'reminder', 'other') then category
  else 'other'
end;

alter table public.manager_tasks
  add constraint manager_tasks_category_check
  check (category = any (array[
    'call'::text,
    'email'::text,
    'follow_up'::text,
    'document'::text,
    'payment'::text,
    'meeting'::text,
    'vendor'::text,
    'reminder'::text,
    'other'::text
  ]));

create index if not exists manager_tasks_manager_date_idx
  on public.manager_tasks (manager_id, task_date);

create index if not exists manager_tasks_building_date_idx
  on public.manager_tasks (building_id, task_date);

create index if not exists manager_tasks_concierge_date_idx
  on public.manager_tasks (concierge_id, task_date);

alter table public.manager_tasks enable row level security;

drop policy if exists "Managers can read own private tasks" on public.manager_tasks;
create policy "Managers can read own private tasks"
on public.manager_tasks
for select
using (manager_id = auth.uid());

drop policy if exists "Managers can create own private tasks" on public.manager_tasks;
create policy "Managers can create own private tasks"
on public.manager_tasks
for insert
with check (
  manager_id = auth.uid()
  and (
    building_id is null
    or exists (
      select 1
      from public.building_users bu
      where bu.building_id = manager_tasks.building_id
        and bu.user_id = auth.uid()
        and bu.role = 'manager'
    )
  )
);

drop policy if exists "Managers can update own private tasks" on public.manager_tasks;
create policy "Managers can update own private tasks"
on public.manager_tasks
for update
using (manager_id = auth.uid())
with check (manager_id = auth.uid());

drop policy if exists "Managers can delete own private tasks" on public.manager_tasks;
create policy "Managers can delete own private tasks"
on public.manager_tasks
for delete
using (manager_id = auth.uid());
