-- "Deseadas" was showing demand for ANY card anyone wished for, even ones
-- nobody in the community actually has — get_wishlist_demand aggregated
-- purely from public.wishlist with no link back to public.cards. Scope it
-- to cards that exist on the market: available, hold, or sold (not just
-- currently listed — a card on hold or already sold is still part of the
-- community's collection and worth showing demand for), matching the same
-- three statuses the "Todas" filter uses. Matched by card_name since
-- public.cards has no pokemon_tcg_id column (same approach getTrendingCards
-- already uses to cross-reference wishlist demand against real listings).

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
    and exists (
      select 1 from public.cards c
      where lower(c.card_name) = lower(w.card_name)
        and c.status in ('available', 'hold', 'sold')
    )
  group by w.pokemon_tcg_id
  order by wish_count desc, max(w.created_at) desc
  limit limit_count;
$$;

grant execute on function public.get_wishlist_demand(int) to authenticated, anon;
