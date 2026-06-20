create table public.messages (
  id          uuid default gen_random_uuid() primary key,
  card_id     uuid not null references public.cards(id) on delete cascade,
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 1000),
  read        boolean default false,
  created_at  timestamptz default now()
);

create index messages_thread_idx    on public.messages(card_id, sender_id, receiver_id);
create index messages_receiver_idx  on public.messages(receiver_id, read) where read = false;

alter table public.messages enable row level security;

create policy "Users see own messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users send messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "Users mark received messages read"
  on public.messages for update to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
