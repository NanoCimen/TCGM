-- SECURITY FIX: the "Anyone can read pending offers" / "Anyone can read
-- accepted offers" policies (20260813_public_pending_offers.sql,
-- 20260813_public_sales_activity.sql) are row-level only — RLS can't
-- restrict columns — so the free-text `message` field (a buyer's
-- negotiation note, which often includes phone numbers or meeting details)
-- was readable by any caller with the public anon key via a direct REST
-- query (e.g. ?select=message), not just through the app's own UI, which
-- never selects `message` for these public views.
--
-- This matches the same column-scoping fix already applied to public.users
-- for `phone` (see 20260805_restrict_phone_visibility.sql): anon loses
-- access entirely, authenticated keeps it (needed for a user's own offers
-- via "Users can read own offers").
--
-- buyer_id/seller_id are deliberately NOT restricted here — the app's
-- public offer queries need them to resource-embed buyer/seller
-- display_name via their foreign keys (users!buyer_id, users!seller_id),
-- and those ids are already effectively public wherever a listing shows
-- its seller.
revoke select on public.offers from anon, authenticated;

grant select (id, card_id, buyer_id, seller_id, offer_price, status, is_buy_now, created_at, responded_at)
  on public.offers to anon, authenticated;

grant select (message) on public.offers to authenticated;
