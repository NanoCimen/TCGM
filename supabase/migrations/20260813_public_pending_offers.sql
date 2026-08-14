-- "Ofertas recibidas" becomes public: any visitor can see every pending
-- offer on a card (amount + buyer name), not just the seller — so buyers
-- can see what it takes to compete instead of bidding blind. Accepted
-- offers are already public (see 20260813_public_sales_activity.sql);
-- this adds the same for pending ones. Declined/cancelled offers stay
-- private — dead negotiations aren't useful market info and there's no
-- reason to expose them.
--
-- Buyer/seller phone numbers are NOT exposed by this policy — phone stays
-- restricted separately (see 20260805_restrict_phone_visibility.sql), and
-- the app-side query for this view only ever selects id/display_name.

create policy "Anyone can read pending offers"
  on public.offers for select
  to anon, authenticated
  using (status = 'pending');
