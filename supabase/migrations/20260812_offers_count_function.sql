-- Aggregate offer counts per card across ALL users, without exposing who
-- offered what. security definer lets this bypass the per-user RLS policy
-- on public.offers ("Users can read own offers") so the trending section can
-- show a public offers count, while only ever returning card_id + a count
-- (never buyer_id, seller_id, or offer_price).
create or replace function public.get_offers_count(card_ids uuid[])
returns table (
  card_id uuid,
  offers_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.card_id,
    count(*) as offers_count
  from public.offers o
  where o.card_id = any(card_ids)
  group by o.card_id;
$$;

grant execute on function public.get_offers_count(uuid[]) to authenticated, anon;
