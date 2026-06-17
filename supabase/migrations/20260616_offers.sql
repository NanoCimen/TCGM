-- Offers / buy-now table
create table public.offers (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references public.cards(id) on delete cascade,
  buyer_id     uuid not null references public.users(id) on delete cascade,
  seller_id    uuid not null references public.users(id) on delete cascade,
  offer_price  numeric(10,2) not null check (offer_price > 0),
  message      text,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  is_buy_now   boolean not null default false,
  created_at   timestamptz default now(),
  responded_at timestamptz,
  constraint no_self_offer check (buyer_id != seller_id)
);

create index offers_card_id_idx   on public.offers(card_id);
create index offers_buyer_id_idx  on public.offers(buyer_id);
create index offers_seller_id_idx on public.offers(seller_id);
create index offers_status_idx    on public.offers(status);

alter table public.offers enable row level security;

-- Buyers and sellers can read their own offers
create policy "Users can read own offers"
  on public.offers for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Buyers can create offers
create policy "Buyers can create offers"
  on public.offers for insert to authenticated
  with check (auth.uid() = buyer_id);

-- Sellers can accept or decline pending offers
create policy "Sellers can respond to offers"
  on public.offers for update to authenticated
  using (auth.uid() = seller_id and status = 'pending')
  with check (auth.uid() = seller_id and status in ('accepted', 'declined'));

-- Buyers can cancel their own pending offers
create policy "Buyers can cancel offers"
  on public.offers for update to authenticated
  using (auth.uid() = buyer_id and status = 'pending')
  with check (auth.uid() = buyer_id and status = 'cancelled');
