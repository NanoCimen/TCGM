-- BUG FIX: get_wishlist_demand (20260813_wishlist_demand_status.sql)
-- aggregated wish_count over every wishlist row sharing a pokemon_tcg_id
-- *before* checking for a real listing match, then only checked the single
-- most-recently-wished card_name against public.cards. Two failure modes:
--   1. If that most-recent name has no listing while an older wish for the
--      same pokemon_tcg_id does, the lateral join finds nothing and the
--      whole group — including the real match — silently disappears.
--   2. When it does match, wish_count still included every row in the
--      group, even ones whose own card_name never matched anything,
--      inflating the displayed demand beyond what any real listing
--      supports.
--
-- Fix: filter wishlist rows down to only those whose own card_name matches
-- an existing listing *before* aggregating by pokemon_tcg_id. Every row
-- that survives the filter has a real match, so wish_count only counts
-- genuine demand and the final lateral join can never come up empty.

create or replace function public.get_wishlist_demand(limit_count int default 200)
returns table (
  pokemon_tcg_id text,
  card_name text,
  card_number text,
  set_name text,
  image_url text,
  variant text,
  wish_count bigint,
  status text
)
language sql
security definer
set search_path = public
stable
as $$
  with matched as (
    select w.pokemon_tcg_id, w.card_name, w.card_number, w.set_name,
           w.image_url, w.variant, w.created_at
    from public.wishlist w
    where w.pokemon_tcg_id is not null
      and exists (
        select 1 from public.cards c
        where lower(c.card_name) = lower(w.card_name)
          and c.status in ('available', 'hold', 'sold')
      )
  ),
  demand as (
    select
      pokemon_tcg_id,
      (array_agg(card_name order by created_at desc))[1] as card_name,
      (array_agg(card_number order by created_at desc))[1] as card_number,
      (array_agg(set_name order by created_at desc))[1] as set_name,
      (array_agg(image_url order by created_at desc))[1] as image_url,
      (array_agg(variant order by created_at desc))[1] as variant,
      count(*) as wish_count,
      max(created_at) as last_wished_at
    from matched
    group by pokemon_tcg_id
  )
  select
    d.pokemon_tcg_id,
    d.card_name,
    d.card_number,
    d.set_name,
    d.image_url,
    d.variant,
    d.wish_count,
    m.status
  from demand d
  join lateral (
    select c.status
    from public.cards c
    where lower(c.card_name) = lower(d.card_name)
      and c.status in ('available', 'hold', 'sold')
    order by case c.status
      when 'available' then 0
      when 'hold' then 1
      else 2
    end
    limit 1
  ) m on true
  order by d.wish_count desc, d.last_wished_at desc
  limit limit_count;
$$;

grant execute on function public.get_wishlist_demand(int) to authenticated, anon;
