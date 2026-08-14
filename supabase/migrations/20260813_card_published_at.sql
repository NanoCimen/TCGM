-- The "Publicado" column on /collection/pokemon was showing created_at,
-- which is when the card row was first uploaded (as a draft) — not when it
-- was actually published to the market. A card sitting in "Sin publicar"
-- for a week before being published, or a resold card (same row, reused
-- via the relist flow), both showed a stale, wrong date. published_at is
-- set/refreshed specifically on the draft → available transition.

alter table public.cards
  add column if not exists published_at timestamptz;

-- Backfill: for cards already available/held/sold, created_at is the best
-- approximation we have of when they went live.
update public.cards
set published_at = created_at
where status in ('available', 'hold', 'sold')
  and published_at is null;
