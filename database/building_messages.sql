create table if not exists public.building_messages (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings_new(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null
    check (sender_role = any (array['concierge'::text, 'manager'::text])),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  recipient_role text not null
    check (recipient_role = any (array['concierge'::text, 'manager'::text])),
  body text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint building_messages_body_not_blank
    check (char_length(btrim(body)) > 0)
);

create index if not exists building_messages_recipient_created_idx
  on public.building_messages (recipient_id, created_at desc);

create index if not exists building_messages_building_created_idx
  on public.building_messages (building_id, created_at desc);

alter table public.building_messages enable row level security;

drop policy if exists "building_messages_select_own" on public.building_messages;
create policy "building_messages_select_own"
  on public.building_messages
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "building_messages_insert_sender" on public.building_messages;
create policy "building_messages_insert_sender"
  on public.building_messages
  for insert
  with check (auth.uid() = sender_id);

drop policy if exists "building_messages_update_recipient" on public.building_messages;
create policy "building_messages_update_recipient"
  on public.building_messages
  for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
