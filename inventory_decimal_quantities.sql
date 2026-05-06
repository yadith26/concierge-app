alter table public.inventory_items
  alter column quantity type numeric(12,2) using quantity::numeric,
  alter column minimum_stock type numeric(12,2) using minimum_stock::numeric;

alter table public.inventory_history
  alter column quantity_before type numeric(12,2) using quantity_before::numeric,
  alter column quantity_change type numeric(12,2) using quantity_change::numeric,
  alter column quantity_after type numeric(12,2) using quantity_after::numeric;
