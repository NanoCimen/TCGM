-- "Deseadas" needs to show each card's current status (Disponible/
-- Reservada/Vendida), not just the wish count — restructure as a CTE so a
-- lateral join can attach the matching card's status, picking whichever
-- status is most actionable when more than one listing shares the name
-- (available > hold > sold — "can I get one right now" is the useful
-- signal). The lateral join also replaces the old exists(...) check from
-- the previous migration — same "must have a real match" filtering, no
-- separate condition needed.

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
  with demand as (
    select
      w.pokemon_tcg_id,
      (array_agg(w.card_name order by w.created_at desc))[1] as card_name,
      (array_agg(w.card_number order by w.created_at desc))[1] as card_number,
      (array_agg(w.set_name order by w.created_at desc))[1] as set_name,
      (array_agg(w.image_url order by w.created_at desc))[1] as image_url,
      (array_agg(w.variant order by w.created_at desc))[1] as variant,
      count(*) as wish_count,
      max(w.created_at) as last_wished_at
    from public.wishlist w
    where w.pokemon_tcg_id is not null
    group by w.pokemon_tcg_id
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
