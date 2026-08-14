-- One-time data repair, not a schema change: buy-now purchases before the
-- app/api/offers/route.ts fix silently failed to put the card on hold (RLS
-- blocked the buyer's session from updating a card they don't own), so the
-- offer recorded as "accepted" but the card stayed "available" — still
-- showing "Comprar" to everyone. This backfills the correct state for any
-- card that has an accepted buy-now offer but wasn't actually put on hold.

update public.cards
set status = 'hold'
where status = 'available'
  and id in (
    select card_id from public.offers
    where status = 'accepted' and is_buy_now = true
  );

-- Same root cause also left rival pending offers on those cards un-declined.
update public.offers o
set status = 'declined', responded_at = now()
where o.status = 'pending'
  and exists (
    select 1 from public.offers a
    where a.card_id = o.card_id
      and a.status = 'accepted'
      and a.is_buy_now = true
  );
