alter table public.tasks
add column if not exists follow_up_source_task_id uuid null references public.tasks(id) on delete set null;

create index if not exists tasks_follow_up_source_task_id_idx
on public.tasks (follow_up_source_task_id);
