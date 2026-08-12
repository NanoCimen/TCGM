-- Lets a user hide a message thread from their own "Mensajes" list without
-- deleting anything or affecting the other participant. Per-user, per
-- (card, other_user) — a new message after closed_at automatically
-- reopens the thread for that user.
create table public.closed_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  card_id       uuid not null references public.cards(id) on delete cascade,
  other_user_id uuid not null references public.users(id) on delete cascade,
  closed_at     timestamptz not null default now(),
  unique (user_id, card_id, other_user_id)
);

create index closed_conversations_user_id_idx on public.closed_conversations(user_id);

alter table public.closed_conversations enable row level security;

create policy "Users manage own closed conversations"
  on public.closed_conversations for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
