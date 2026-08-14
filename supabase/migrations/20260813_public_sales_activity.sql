-- "Actividad de ventas" (ActivityPanel on /collection/pokemon) is meant to
-- be a global feed of recent completed sales, but the only existing SELECT
-- policy on offers restricts reads to your own buyer_id/seller_id rows —
-- so logged-out visitors saw nothing, and logged-in users only saw sales
-- they were personally involved in. Completed (accepted) sales are safe to
-- expose publicly (card, price, buyer/seller display names — no messages,
-- no phone numbers); pending/declined/cancelled offers stay private via
-- the existing "Users can read own offers" policy.

create policy "Anyone can read accepted offers"
  on public.offers for select
  to anon, authenticated
  using (status = 'accepted');
