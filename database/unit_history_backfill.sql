insert into public.unit_history (
  building_id,
  unit_key,
  unit_label,
  event_type,
  event_category,
  title,
  description,
  happened_at,
  source_table,
  source_id,
  created_by,
  metadata,
  updated_at
)
select
  t.building_id,
  coalesce(
    nullif(trim(t.apartment_key), ''),
    lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(coalesce(t.apartment_or_area, '')), '[./\\-]', ' ', 'g'),
          '\s+',
          ' ',
          'g'
        ),
        '\s+',
        '',
        'g'
      )
    )
  ),
  trim(coalesce(t.apartment_or_area, '')),
  'task_completed',
  t.category,
  case
    when t.category = 'delivery' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%refrigerador%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%nevera%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%fridge%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%refrigerator%'
    ) then 'Refrigerator installed'
    when t.category = 'delivery' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%cocina%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%estufa%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%stove%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%oven%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%range%'
    ) then 'Stove installed'
    when t.category = 'delivery' then 'Delivery completed'
    when t.category = 'paint' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%kitchen%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%cocina%'
    ) then 'Kitchen painted'
    when t.category = 'paint' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%bedroom%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%dormitorio%'
    ) then 'Bedroom painted'
    when t.category = 'paint' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%bathroom%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%bano%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%baño%'
    ) then 'Bathroom painted'
    when t.category = 'paint' then 'Painting completed'
    when t.category = 'repair' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%grifo%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%faucet%'
    ) then 'Faucet repair'
    when t.category = 'repair' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%toilet%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%inodoro%'
    ) then 'Toilet repair'
    when t.category = 'repair' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%sink%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%lavamanos%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%fregadero%'
    ) then 'Sink repair'
    when t.category = 'repair' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%door%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%puerta%'
    ) then 'Door repair'
    when t.category = 'repair' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%window%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%ventana%'
    ) then 'Window repair'
    when t.category = 'repair' then 'Repair completed'
    when t.category = 'inspection' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%move out%'
      or lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%mudanza%'
    ) then 'Move-out inspection'
    when t.category = 'inspection' and (
      lower(coalesce(t.title, '') || ' ' || coalesce(t.description, '')) like '%move in%'
    ) then 'Move-in inspection'
    when t.category = 'inspection' then 'Inspection completed'
    else t.title
  end,
  nullif(trim(t.description), ''),
  t.task_date,
  'tasks',
  t.id,
  t.created_by,
  jsonb_build_object(
    'category', t.category,
    'priority', t.priority,
    'task_date', t.task_date
  ),
  now()
from public.tasks t
where t.status = 'completed'
  and t.category = any (array['repair'::text, 'paint'::text, 'delivery'::text, 'inspection'::text])
  and trim(coalesce(t.apartment_or_area, '')) <> ''
on conflict (source_table, source_id, unit_key, event_type)
do update set
  title = excluded.title,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.unit_history (
  building_id,
  unit_key,
  unit_label,
  event_type,
  event_category,
  title,
  description,
  happened_at,
  source_table,
  source_id,
  created_by,
  metadata,
  updated_at
)
select
  pt.building_id,
  coalesce(
    nullif(trim(pt.apartment_key), ''),
    lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(coalesce(pt.apartment_or_area, '')), '[./\\-]', ' ', 'g'),
          '\s+',
          ' ',
          'g'
        ),
        '\s+',
        '',
        'g'
      )
    )
  ),
  trim(coalesce(pt.apartment_or_area, '')),
  'pest_treatment_recorded',
  'pest',
  case
    when pt.treatment_visit_type = 'seguimiento' and pt.pest_target = 'cucarachas' then 'Cockroach follow-up'
    when pt.treatment_visit_type = 'seguimiento' and pt.pest_target = 'roedores' then 'Rodent follow-up'
    when pt.treatment_visit_type = 'seguimiento' and pt.pest_target = 'chinches' then 'Bedbug follow-up'
    when pt.treatment_visit_type = 'preventivo' and pt.pest_target = 'cucarachas' then 'Cockroach preventive treatment'
    when pt.treatment_visit_type = 'preventivo' and pt.pest_target = 'roedores' then 'Rodent preventive treatment'
    when pt.treatment_visit_type = 'preventivo' and pt.pest_target = 'chinches' then 'Bedbug preventive treatment'
    when pt.pest_target = 'cucarachas' then 'Cockroach treatment'
    when pt.pest_target = 'roedores' then 'Rodent treatment'
    when pt.pest_target = 'chinches' then 'Bedbug treatment'
    else 'Pest treatment'
  end,
  nullif(trim(pt.notes), ''),
  pt.treatment_date,
  'pest_treatments',
  pt.id,
  pt.created_by,
  jsonb_build_object(
    'pest_target', pt.pest_target,
    'treatment_visit_type', pt.treatment_visit_type,
    'task_id', pt.task_id
  ),
  now()
from public.pest_treatments pt
where trim(coalesce(pt.apartment_or_area, '')) <> ''
on conflict (source_table, source_id, unit_key, event_type)
do update set
  title = excluded.title,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;
