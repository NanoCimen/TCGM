-- Saved / favorited listings
create table public.saved_listings (
  user_id    uuid not null references public.users(id) on delete cascade,
  card_id    uuid not null references public.cards(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, card_id)
);

create index saved_listings_user_idx on public.saved_listings(user_id);

alter table public.saved_listings enable row level security;

create policy "Users manage own saved listings"
  on public.saved_listings for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
