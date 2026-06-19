create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  card_id    uuid references public.cards(id) on delete set null,
  message    text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_unread_idx  on public.notifications(user_id, read) where read = false;

alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

-- Any authenticated user can insert notifications (needed for cross-user: buyer→seller, seller→buyer)
create policy "Authenticated users can create notifications"
  on public.notifications for insert to authenticated
  with check (true);

-- Users can mark their own notifications as read
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
