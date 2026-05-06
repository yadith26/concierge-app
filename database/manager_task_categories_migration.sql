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
