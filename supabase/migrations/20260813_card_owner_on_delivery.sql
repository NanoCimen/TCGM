-- Track who currently owns a card once a sale's delivery is confirmed,
-- separate from seller_id (which stays as "who listed/sold it" so the
-- seller keeps their own sales history under the "Ventas" tab). owner_id
-- is set to the buyer when the seller confirms delivery, and is what makes
-- a purchased card show up in the buyer's own "Colección" tab.

alter table public.cards
  add column if not exists owner_id uuid references public.users(id) on delete set null;

create index if not exists cards_owner_id_idx on public.cards(owner_id);

-- Backfill: cards already marked sold before this column existed should
-- also show up in their buyer's collection, not just future sales.
update public.cards c
set owner_id = o.buyer_id
from public.offers o
where c.status = 'sold'
  and c.owner_id is null
  and o.card_id = c.id
  and o.status = 'accepted';
