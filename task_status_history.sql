create table if not exists public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  building_id uuid null references public.buildings(id) on delete set null,
  changed_by uuid null references public.profiles(id) on delete set null,
  from_status text not null,
  to_status text not null,
  reason text null,
  created_at timestamptz not null default now()
);

create index if not exists task_status_history_task_id_idx
  on public.task_status_history (task_id, created_at desc);

create index if not exists task_status_history_building_id_idx
  on public.task_status_history (building_id, created_at desc);

alter table public.task_status_history
  drop constraint if exists task_status_history_from_status_check;

alter table public.task_status_history
  add constraint task_status_history_from_status_check
  check (from_status in ('pending', 'in_progress', 'completed'));

alter table public.task_status_history
  drop constraint if exists task_status_history_to_status_check;

alter table public.task_status_history
  add constraint task_status_history_to_status_check
  check (to_status in ('pending', 'in_progress', 'completed'));
