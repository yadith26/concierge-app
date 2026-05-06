alter table public.inventory_items
  add column if not exists unit_of_measure text;

update public.inventory_items
set unit_of_measure = 'unidad'
where unit_of_measure is null or btrim(unit_of_measure) = '';

alter table public.inventory_items
  alter column unit_of_measure set default 'unidad';

create index if not exists inventory_items_unit_of_measure_idx
  on public.inventory_items (unit_of_measure);
