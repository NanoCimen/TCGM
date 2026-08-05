-- SECURITY FIX: phone numbers were readable by fully anonymous (logged-out)
-- API callers.
--
-- Row Level Security is row-level only — it can't hide individual columns.
-- The existing "Anyone can read public profiles" policy (to anon, authenticated,
-- using display_name is not null) was written to let logged-out visitors browse
-- the marketplace and see seller names/avatars, but since RLS can't scope by
-- column, it also exposed every other column on that row — including `phone`
-- — to anyone with the public anon key, no login required.
--
-- This grants column-level privileges to close that gap: anonymous callers
-- keep read access to the public-facing profile fields the marketplace needs,
-- but `phone` now requires an authenticated session — matching how the app
-- already requires login before a phone number is ever used (buying a card,
-- messaging, or the post-deal WhatsApp handoff).
revoke select on public.users from anon, authenticated;

grant select (id, display_name, avatar_url, banner_url, created_at)
  on public.users to anon, authenticated;

grant select (id, display_name, avatar_url, banner_url, created_at, phone, invite_code_used)
  on public.users to authenticated;
