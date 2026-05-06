alter table public.inventory_history
  add column if not exists movement_type text,
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists source_label text,
  add column if not exists unit_label text;

create index if not exists inventory_history_source_id_idx
  on public.inventory_history(source_id);

alter table public.inventory_history
  drop constraint if exists inventory_history_movement_type_check;

alter table public.inventory_history
  add constraint inventory_history_movement_type_check
  check (
    movement_type is null
    or movement_type in (
      'created',
      'updated',
      'entry',
      'exit',
      'installed',
      'manual_adjustment'
    )
  );

alter table public.inventory_history
  drop constraint if exists inventory_history_source_type_check;

alter table public.inventory_history
  add constraint inventory_history_source_type_check
  check (
    source_type is null
    or source_type in ('task', 'manual', 'manager', 'system')
  );

update public.inventory_history
set movement_type = case
  when action_type = 'created' then 'created'
  when action_type = 'edited' then 'updated'
  when action_type = 'stock_adjustment' and quantity_change > 0 then 'entry'
  when action_type = 'stock_adjustment' and quantity_change < 0 then 'exit'
  else 'manual_adjustment'
end
where movement_type is null;

update public.inventory_history
set source_type = 'manual'
where source_type is null;
