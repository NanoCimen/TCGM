-- Seller ratings / reviews
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.users(id) on delete cascade,
  seller_id   uuid not null references public.users(id) on delete cascade,
  card_id     uuid references public.cards(id) on delete set null,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now(),
  unique(reviewer_id, card_id)
);

create index reviews_seller_id_idx on public.reviews(seller_id);
create index reviews_reviewer_id_idx on public.reviews(reviewer_id);

alter table public.reviews enable row level security;

-- Anyone can read reviews
create policy "Anyone can read reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- Buyers can create reviews (one per card transaction)
create policy "Buyers can create reviews"
  on public.reviews for insert to authenticated
  with check (auth.uid() = reviewer_id and reviewer_id != seller_id);

-- Reviewers can delete own reviews
create policy "Reviewers can delete own reviews"
  on public.reviews for delete to authenticated
  using (auth.uid() = reviewer_id);
