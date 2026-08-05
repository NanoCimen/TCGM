-- Aggregate wishlist demand across ALL users, without exposing who wants what.
-- security definer + owner bypassrls lets this bypass the per-user RLS policy
-- on public.wishlist ("Users manage own wishlist") so we can count everyone's
-- entries, while only ever returning card-level aggregates (never user_id).
create or replace function public.get_wishlist_demand(limit_count int default 200)
returns table (
  pokemon_tcg_id text,
  card_name text,
  card_number text,
  set_name text,
  image_url text,
  variant text,
  wish_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    w.pokemon_tcg_id,
    (array_agg(w.card_name order by w.created_at desc))[1] as card_name,
    (array_agg(w.card_number order by w.created_at desc))[1] as card_number,
    (array_agg(w.set_name order by w.created_at desc))[1] as set_name,
    (array_agg(w.image_url order by w.created_at desc))[1] as image_url,
    (array_agg(w.variant order by w.created_at desc))[1] as variant,
    count(*) as wish_count
  from public.wishlist w
  where w.pokemon_tcg_id is not null
  group by w.pokemon_tcg_id
  order by wish_count desc, max(w.created_at) desc
  limit limit_count;
$$;

grant execute on function public.get_wishlist_demand(int) to authenticated, anon;
