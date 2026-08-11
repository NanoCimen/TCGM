-- 20260805_restrict_phone_visibility.sql replaced the broad SELECT grant on
-- public.users with an explicit column allowlist for `authenticated`. That
-- allowlist was written before `theme_color` existed, so every subsequent
-- read of it (display_name, avatar_url, theme_color, phone selects on
-- /perfil, /dashboard, /wishlist, /actividad) has been silently rejected at
-- the Postgres grant level — not RLS — since the column was added. The
-- PATCH/update path was unaffected (UPDATE grant is still broad), which is
-- why saves appeared to succeed while every read kept resetting to defaults.
--
-- Run this in the Supabase SQL Editor.

grant select (theme_color) on public.users to authenticated;
