-- 20260805_restrict_phone_visibility.sql replaced the broad SELECT grant on
-- public.users with an explicit column allowlist for `authenticated`
-- (20260812_grant_theme_color_select.sql already hit this once for
-- theme_color). username_claimed, added in 20260818_username_rename_and_
-- rate_limit.sql, was never added to that allowlist, so any select()
-- including it fails at the Postgres grant level (not RLS) — the profile
-- page and the rate-limit check in /api/profile silently got back a null
-- row and skipped the username update entirely while still reporting
-- success, since phone/theme_color still saved fine.
--
-- Run this in the Supabase SQL Editor.

grant select (username_claimed) on public.users to authenticated;
